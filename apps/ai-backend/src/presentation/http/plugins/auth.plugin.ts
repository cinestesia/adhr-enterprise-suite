import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import fastifyJwt from '@fastify/jwt'
import jwksRsa from 'jwks-rsa'

const keycloakIssuer =
    process.env.KEYCLOAK_ISSUER || 'http://auth.4.232.3.98.nip.io/realms/internal-adhr'

// JWKS client (creato UNA volta sola)
const client = jwksRsa({
    jwksUri: `${keycloakIssuer}/protocol/openid-connect/certs`,
    cache: true,
    cacheMaxEntries: 5, // memorizza fino a 5 chiavi in cache
    
    // ogni chiave (kid) viene salvata in cache, se arriva un tken con lo stesso kid entro 10 minuti usa lòa cache
    // altrimenti rifà una richiesta all'endpoint JWKS per recuperare la chiave aggiornata 
    // (utile in caso di rotazione delle chiavi)
    cacheMaxAge: 600000, // 10 minuti in ms
})

export async function authPlugin(fastify: FastifyInstance) {
    await fastify.register(fastifyJwt, {
        secret: async (_request: FastifyRequest, token: string | object) => {
            if (typeof token !== 'string') {
                throw new Error('Token JWT non valido (non è una stringa)')
            }

            const decoded = fastify.jwt.decode(token, { complete: true }) as {
                header?: { kid?: string }
            } | null

            const kid = decoded?.header?.kid
            if (!kid) {
                throw new Error('Token JWT senza kid')
            }

            const key = await client.getSigningKey(kid)
            return key.getPublicKey()
        },

        verify: {
            // il jwt ha alcuni campi come exp, nbf, iat con clocktolerance di 30 secondi 
            // per gestire piccoli disallineamenti tra server e client
            // exp = 10:00:00 del token, se il server è a 10:00:25 considererà 
            // ancora valido il token (tolleranza di 30 secondi)
            clockTolerance: 30,
        } as any
    })

    fastify.decorate(
        'authenticate',
        async (request: FastifyRequest, reply: FastifyReply) => {
            try {
                await request.jwtVerify()

                const payload = request.user as { iss?: string }

                if (payload.iss !== keycloakIssuer) {
                    return reply.code(401).send({
                        error: 'UNAUTHORIZED',
                        message: 'Issuer non valido',
                    })
                }
            } catch (err) {
                return reply.code(401).send({
                    error: 'UNAUTHORIZED',
                    message: 'Token non valido o scaduto',
                })
            }
        }
    )
}
