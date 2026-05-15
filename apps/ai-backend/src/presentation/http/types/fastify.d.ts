import 'fastify'
import { ChatController } from '@/interfaces/http/controllers/chat.controller'
import { IngestController } from '@/interfaces/http/controllers/ingest.controller'

declare module 'fastify' {
    interface FastifyInstance {
        config: {
            PORT: string
            HOST: string
            AI_BASE_URL: string
            AI_MODEL_NAME: string
            CORS_ORIGIN: string
        },
        authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    }

    interface FastifyInstance {
        chatController: ChatController
        ingestController: IngestController
    }
}
