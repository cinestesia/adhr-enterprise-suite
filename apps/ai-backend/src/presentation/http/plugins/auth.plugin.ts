import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import fastifyJwt from '@fastify/jwt'
import jwksRsa from 'jwks-rsa'
import fp from 'fastify-plugin'

/**
 * @note
 * Utilizziamo fastify-plugin per "rompere" l'incapsulamento di Fastify.
 * Senza questo, le decorazioni come .authenticate resterebbero confinate
 * all'interno di questo plugin e non sarebbero visibili nelle rotte.
 */
export const authPlugin = fp(async function authPlugin(fastify: FastifyInstance) {
    const keycloakIssuer =
        process.env.KEYCLOAK_ISSUER ||
        'https://auth.4.232.3.98.nip.io/realms/internal-adhr'

    // JWKS client per recuperare le chiavi pubbliche di Keycloak
    const client = jwksRsa({
        jwksUri: `${keycloakIssuer}/protocol/openid-connect/certs`,
        cache: true,
        cacheMaxEntries: 5,
        cacheMaxAge: 600000, // 10 minuti
    })

    // secret: async (_request: FastifyRequest, token: string | object) => {
    //     console.log("TOKKKKEN", token)
    //     if (typeof token !== 'string') {
    //         throw new Error('Token JWT non valido (non è una stringa)')
    //     }

    //     const decoded = fastify.jwt.decode(token, { complete: true }) as {
    //         header?: { kid?: string }
    //     } | null

    //     const kid = decoded?.header?.kid
    //     if (!kid) {
    //         throw new Error('Token JWT senza kid')
    //     }

    //     const key = await client.getSigningKey(kid)
    //     return key.getPublicKey()
    // },

    // Registrazione del plugin JWT
    await fastify.register(fastifyJwt, {
        secret: async (request: FastifyRequest /**tokenOrPayload: string | object**/) => {
            // 1. Recuperiamo il token crudo dall'header Authorization
            // perché è lì che risiede il 'kid' nell'header del JWT
            const authHeader = request.headers.authorization
            const rawToken = authHeader?.split(' ')[1]

            if (!rawToken) {
                throw new Error('Manca il token nella richiesta')
            }

            // 2. Decodifichiamo l'header per trovare il kid
            const decoded = fastify.jwt.decode(rawToken, { complete: true }) as {
                header?: { kid?: string }
            } | null

            const kid = decoded?.header?.kid

            if (!kid) {
                throw new Error('Token JWT senza kid nell’header')
            }

            // 3. Chiediamo a Keycloak la chiave pubblica per questo specifico kid
            const key = await client.getSigningKey(kid)
            return key.getPublicKey()
        },
        verify: {
            clockTolerance: 30, // Tolleranza per disallineamento orari server
        },
    })

    /**
     * Decoratore .authenticate
     * Utilizzabile nelle rotte come hook preHandler o onRequest:
     * { onRequest: [fastify.authenticate] }
     */
    fastify.decorate(
        'authenticate',
        async (request: FastifyRequest, reply: FastifyReply) => {
            try {
                // Esegue la verifica del token presente nell'header Authorization
                await request.jwtVerify()

                // Validazione extra dell'Issuer per sicurezza
                const payload = request.user as { iss?: string }
                if (payload.iss !== keycloakIssuer) {
                    return reply.code(401).send({
                        error: 'UNAUTHORIZED',
                        message: 'Issuer non valido',
                    })
                }
            } catch (err) {
                fastify.log.error(err)
                return reply.code(401).send({
                    error: 'UNAUTHORIZED',
                    message: 'Token non valido o scaduto',
                })
            }
        }
    )
})
