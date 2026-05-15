import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import { ChatController } from '@/presentation/http/controllers/chat.controller'
import { IngestController } from '@/presentation/http/controllers/ingest.controller'
import { IngestFileUseCase } from '@/application/use-cases/ingest-file.use-case'
import { LocalStorageAdapter } from '@/infrastructure/storage/local-storage.adapter'
import { OllamaAdapter } from '@/infrastructure/ai/ollama.adapter'
import { PgVectorAdapter } from '@/infrastructure/ai/pg-vector.adapter'
import { createDbClient } from '@/infrastructure/db'
import { PgChatAdapter } from '@/infrastructure/db/pg-chat.adapter'
import { ChatUseCase } from '@/application/use-cases/chat.use-case'
import { RagService } from '@/application/services/rag.service'
import { SessionService } from '@/application/services/session.service'
import { ChatStreamService } from '@/application/services/chat-stream.service'
import { PromptBuilder } from '@/application/services/prompt-builder.service'
import { GetChatHistoryUseCase } from '@/application/use-cases/get-chat-history.use-case'
import { GetUserSessionsUseCase } from '@/application/use-cases/get-user-sessions.use-case'

export const diPlugin = fp(async function diPlugin(fastify: FastifyInstance) {
    // Chat controller
    const aiAdapter = new OllamaAdapter()
    
    const vectorDbAdapter = new PgVectorAdapter(
        aiAdapter,
        createDbClient(process.env.DATABASE_URL!)
    )
    
    const chatRepo = new PgChatAdapter(createDbClient(process.env.DATABASE_URL!))
            
    const sessionService = new SessionService(chatRepo, aiAdapter) 
    const ragService = new RagService(vectorDbAdapter)
    const promptBuilder = new PromptBuilder()
    const streamService = new ChatStreamService(chatRepo)

    // File ingestion controller
    const storageAdapter = new LocalStorageAdapter()
    const ingestFileUseCase = new IngestFileUseCase(storageAdapter, vectorDbAdapter)
    const ingestController = new IngestController(ingestFileUseCase)

    const chatUseCase = new ChatUseCase(
        sessionService, 
        ragService, 
        streamService, 
        promptBuilder, 
        chatRepo, 
        aiAdapter
    )
    
    const getChatHistoryUseCase = new GetChatHistoryUseCase(chatRepo)
    const getUserSessionsUseCase = new GetUserSessionsUseCase(chatRepo)
    const chatController = new ChatController(chatUseCase, getChatHistoryUseCase, getUserSessionsUseCase)


    fastify.decorate('chatController', chatController)
    fastify.decorate('ingestController', ingestController)
})

declare module 'fastify' {
    interface FastifyInstance {
        chatController: ChatController
    }
}
