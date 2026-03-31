/**
 * ChatController: Gestisce le richieste HTTP per la chat, interfacciandosi con il ChatUseCase e l'adapter AI.
 */

import { ChatUseCase } from '@/application/use-cases/chat.use-case'
import { ChatRequest } from '@/domain/models/chat'
import { FastifyRequest, FastifyReply } from 'fastify'
import { initSSE, sendSSE } from '@/interfaces/http/helpers/sse.helpers'

export class ChatController {
    constructor(private chatUseCase: ChatUseCase) {}

    async handleChat(
        request: FastifyRequest<{ Body: ChatRequest }>,
        reply: FastifyReply
    ) {
        let isClosed = false
        const { message, history } = request.body
        initSSE(reply)

        // Gestione chiusura connessione
        reply.raw.on('close', () => {
            isClosed = true
            request.log.info('Client disconnected')
        })

        try {
            const stream = await this.chatUseCase.execute(message, history || [])

            for await (const chunk of stream) {
                if (isClosed) break
                await sendSSE(reply, { type: 'token', content: chunk })
            }

            if (!isClosed) {
                await sendSSE(reply, { type: 'done' })
            }
        } catch (error: unknown) {
            request.log.error(error)
            const message =
                error instanceof Error ? error.message : 'Errore durante lo streaming'

            if (!isClosed) {
                await sendSSE(reply, {
                    type: 'error',
                    error: { code: 'CHAT_ERROR', message },
                })
            }
        } finally {
            reply.raw.end() // assicuro che la connessione venga chiusa in ogni caso
        }
    }
}
