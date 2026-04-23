import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import { LocalAIAdapter } from '@/infrastructure/ai/localai-adapter'
import { ChatUseCase } from '@/application/use-cases/chat.use-case'
import { ChatController } from '@/presentation/http/controllers/chat.controller'
import { IngestController } from '@/presentation/http/controllers/ingest.controller'
import { IngestFileUseCase } from '@/application/use-cases/ingest-file.use-case'
import { LocalStorageAdapter } from '@/infrastructure/storage/local-storage.adapter'

export const diPlugin = fp(async function diPlugin(fastify: FastifyInstance) {
    
    // Chat controller
    const aiAdapter = new LocalAIAdapter()
    const chatUseCase = new ChatUseCase(aiAdapter)
    const chatController = new ChatController(chatUseCase)

    // File ingestion controller
    const storageAdapter = new LocalStorageAdapter() 
    const ingestFileUseCase = new IngestFileUseCase(storageAdapter, aiAdapter) 
    const ingestController = new IngestController(ingestFileUseCase)

    fastify.decorate('chatController', chatController)
    fastify.decorate('ingestController', ingestController)
})

declare module 'fastify' {
    interface FastifyInstance {
        chatController: ChatController
    }
}
