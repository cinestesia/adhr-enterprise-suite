// src/presentation/http/chat.routes.ts
import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { BaseChatRequestSchema } from '@/dtos/chat-request.dto'
import { z } from 'zod'

export async function chatRoutes(
    fastify: FastifyInstance,
    _options: FastifyPluginOptions
) {
    // 1. POST - Streaming Chat (Esistente)
    fastify.post(
        '/chat',
        { 
            onRequest: [fastify.authenticate],
            schema: {
                description: 'Invia un messaggio in streaming',
                tags: ['Chat'],
                body: BaseChatRequestSchema
            }
        },
        fastify.chatController.handleChat.bind(fastify.chatController)
    )

    // 2. GET - Recupera lo storico messaggi di una sessione
    fastify.get(
        '/chat/history/:sessionId',
        {
            onRequest: [fastify.authenticate],
            schema: {
                description: 'Recupera i messaggi di una specifica sessione',
                tags: ['Chat'],
                params: z.object({
                    sessionId: z.string().uuid()
                })
            }
        },
        fastify.chatController.getHistory.bind(fastify.chatController)
    )

    // 3. GET - Recupera la lista di tutte le sessioni dell'utente
    fastify.get(
        '/chat/sessions',
        {
            onRequest: [fastify.authenticate],
            schema: {
                description: 'Recupera tutte le sessioni chat dell\'utente loggato',
                tags: ['Chat']
            }
        },
        fastify.chatController.getSessions.bind(fastify.chatController)
    )
}