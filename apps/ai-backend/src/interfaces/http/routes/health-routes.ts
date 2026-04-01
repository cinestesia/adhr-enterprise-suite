// routes/health.js (o direttamente nel tuo server.js)

import { FastifyInstance, FastifyPluginOptions } from 'fastify'

export async function healthRoutes(
    fastify: FastifyInstance,
    options: FastifyPluginOptions
) {
    fastify.get('/health', async (request, reply) => {
        // 1. Controllo per la STARTUP PROBE
        // Se l'app ha finito di caricare i moduli ed è arrivata a questo punto del codice,
        // significa che si è "svegliata" correttamente.

        // 2. Controllo per la LIVENESS PROBE
        // Finché Node.js risponde a questa chiamata, significa che l'event loop non è bloccato.
        // Non serve fare controlli pesanti qui, basta rispondere 200 OK.

        // 3. Controllo per la READINESS PROBE (Il più importante!)
        // Qui dobbiamo capire se il backend è PRONTO a ricevere traffico.
        // Esempio: Il database Postgres è raggiungibile?

        try {
            // Modifica questa riga in base a come gestisci il tuo DB (es. Prisma, TypeORM, o pg)
            // Facciamo una query leggerissima per vedere se il DB risponde.
            // await fastify.pg.query('SELECT 1');
        } catch (error) {
            // Se il DB è giù, rispondiamo con un errore 503 (Service Unavailable).
            // Kubernetes lo vedrà e "staccherà la spina" del traffico a questo Pod
            // finché il DB non torna raggiungibile!
            fastify.log.error({ err: error }, 'Database non raggiungibile')

            return reply.code(503).send({
                status: 'DOWN',
                reason: 'Database unreachable',
            })
        }

        // Se tutto va bene, rispondiamo 200 OK
        return reply.code(200).send({
            status: 'UP',
            timestamp: new Date().toISOString(),
        })
    })
}

