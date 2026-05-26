import { FastifyInstance } from 'fastify'

export async function recruitingRoutes(fastify: FastifyInstance) {
    // Rotta 1: Caricamento ed Estrazione immediata (Fase 1)
    fastify.post(
        '/recruiting/extract',
        fastify.recruitingController.extract.bind(fastify.recruitingController)
    )

    // Rotta 2: Conferma dell'operatore e persistenza (Fase 2)
    fastify.post(
        '/recruiting/confirm',
        fastify.recruitingController.confirm.bind(fastify.recruitingController)
    )
}
