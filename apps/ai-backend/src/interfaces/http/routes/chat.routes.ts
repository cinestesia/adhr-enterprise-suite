import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { ChatRequestSchema } from '@/domain/models/chat'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'

export async function chatRoutes(
    fastify: FastifyInstance,
    _options: FastifyPluginOptions
) {
    fastify.setValidatorCompiler(validatorCompiler)
    fastify.setSerializerCompiler(serializerCompiler)
    fastify.post(
        '/chat',
        { schema: { body: ChatRequestSchema } },
        fastify.chatController.handleChat.bind(fastify.chatController)
    )
}
