import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import { ChatUseCase } from '@/application/use-cases/chat.use-case'
import { ChatController } from '@/presentation/http/controllers/chat.controller'
import { IngestController } from '@/presentation/http/controllers/ingest.controller'
import { IngestFileUseCase } from '@/application/use-cases/ingest-file.use-case'
import { LocalStorageAdapter } from '@/infrastructure/storage/local-storage.adapter'
import { OllamaAdapter } from '@/infrastructure/ai/ollama.adapter'
import { PgVectorAdapter } from '@/infrastructure/ai/pg-vector.adapter'
import { createDbClient } from '@/infrastructure/db'

export const diPlugin = fp(async function diPlugin(fastify: FastifyInstance) {
    // Chat controller
    const aiAdapter = new OllamaAdapter()
    const vectorDbAdapter = new PgVectorAdapter(
        aiAdapter,
        createDbClient(process.env.DATABASE_URL!)
    )
    const chatUseCase = new ChatUseCase(aiAdapter, vectorDbAdapter)
    const chatController = new ChatController(chatUseCase)

    // File ingestion controller
    const storageAdapter = new LocalStorageAdapter()
    const ingestFileUseCase = new IngestFileUseCase(storageAdapter, vectorDbAdapter)
    const ingestController = new IngestController(ingestFileUseCase)

    fastify.decorate('chatController', chatController)
    fastify.decorate('ingestController', ingestController)
})

declare module 'fastify' {
    interface FastifyInstance {
        chatController: ChatController
    }
}
