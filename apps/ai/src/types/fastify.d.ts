// apps/ai-service/src/types/fastify.d.ts
import 'fastify'
import { ChatController } from '@/interfaces/http/controllers/chat.controller'

declare module 'fastify' {
    interface FastifyInstance {
        config: {
            PORT: string
            HOST: string
            AI_BASE_URL: string
            AI_MODEL_NAME: string
            CORS_ORIGIN: string
        }
    }

    interface FastifyInstance {
        chatController: ChatController
    }
}
