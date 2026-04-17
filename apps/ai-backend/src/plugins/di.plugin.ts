import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import { LocalAIAdapter } from '@/infrastructure/ai/localai-adapter'
import { ChatUseCase } from '@/application/use-cases/chat.use-case'
import { ChatController } from '@/interfaces/http/controllers/chat.controller'

export const diPlugin = fp(async function diPlugin(fastify: FastifyInstance) {
    const aiAdapter = new LocalAIAdapter()
    const chatUseCase = new ChatUseCase(aiAdapter)
    const chatController = new ChatController(chatUseCase)
    fastify.decorate('chatController', chatController)
})

declare module 'fastify' {
    interface FastifyInstance {
        chatController: ChatController
    }
}
