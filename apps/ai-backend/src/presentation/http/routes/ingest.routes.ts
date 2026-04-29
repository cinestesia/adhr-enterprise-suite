import { FastifyInstance } from 'fastify'
import {
    serializerCompiler,
    validatorCompiler,
    ZodTypeProvider,
} from 'fastify-type-provider-zod'

export async function ingestRoutes(fastify: FastifyInstance) {
    fastify.setValidatorCompiler(validatorCompiler)
    fastify.setSerializerCompiler(serializerCompiler)

    const typedFastify = fastify.withTypeProvider<ZodTypeProvider>()

    typedFastify.post(
        '/ingest',
        fastify.ingestController.handleUpload.bind(fastify.ingestController)
    )
}
