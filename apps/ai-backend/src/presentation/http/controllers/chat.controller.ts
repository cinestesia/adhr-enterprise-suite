import { FastifyRequest, FastifyReply } from 'fastify'
import { initSSE, sendSSE } from '@/presentation/http/helpers/sse.helpers'
import { AuthTokenToUserMapper } from '@/presentation/mappers/auth-token-to-user.mapper'
import { ChatRequestDTO, ChatRequestSchema } from '@/modules/chat/dtos/chat-request.dto'
import { z } from 'zod'
import { ChatUseCase } from '@/modules/chat/application/use-cases/chat.use-case'
import { GetChatHistoryUseCase } from '@/modules/chat/application/use-cases/get-chat-history.use-case'
import { GetUserSessionsUseCase } from '@/modules/chat/application/use-cases/get-user-sessions.use-case'
import { ChatViewMapper } from '@/presentation/mappers/chat-view.mapper'

export class ChatController {
    constructor(
        private chatUseCase: ChatUseCase,
        private getChatHistoryUseCase: GetChatHistoryUseCase,
        private getUserSessionsUseCase: GetUserSessionsUseCase
    ) {}

    async getHistory(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { sessionId } = request.params as { sessionId: string }
            const userDomain = AuthTokenToUserMapper.toDomain(request.user)
            const messages = await this.getChatHistoryUseCase.execute(
                sessionId,
                userDomain.id
            )
            return reply.send(messages)
        } catch (error) {
            return reply
                .code(403)
                .send({ error: 'FORBIDDEN', message: (error as Error).message })
        }
    }

    async getSessions(request: FastifyRequest, reply: FastifyReply) {
        try {
            const userDomain = AuthTokenToUserMapper.toDomain(request.user)
            const sessions = await this.getUserSessionsUseCase.execute(userDomain.id)
            const responseBody = sessions.map((session) =>
                ChatViewMapper.toResponse(session)
            )
            return reply.send(responseBody)
        } catch (error) {
            request.log.error(error)
            return reply.code(500).send({ error: 'INTERNAL_ERROR' })
        }
    }

    async handleChat(request: FastifyRequest, reply: FastifyReply) {
        let isClosed = false

        try {
            const userDomain = AuthTokenToUserMapper.toDomain(request.user)

            /**
             * @note
             * Validiamo il dato: un messsaggio di almeno 1 carattere è obbligatorio.
             * sessionId() è opzionale, se presente deve essere una UUID.
             * user deve essere un'istanza di User (già garantita dal mapper).
             *
             * Si noti che a questo livello avvendono 3 cose:
             * 1. Controllo dei tipi
             * 2. Controllo dei vincoli
             * 3. Sanificazione ( rimozione di eventuali campi extra non definiti nello schema )
             *
             */

            const validatedData: ChatRequestDTO = ChatRequestSchema.parse({
                ...(request.body as object),
                user: userDomain,
            })

            // Inizializziamo SSE ( Server Side Events ) solo dopo che la validazione è passata
            initSSE(reply)

            // Gestione chiusura connessione
            reply.raw.on('close', () => {
                isClosed = true
                request.log.info(
                    `Client disconnected from session: ${validatedData.sessionId}`
                )
            })

            // Il caso d'uso riceve il DTO validato.
            // Restituisce lo stream e la sessionId (che potrebbe essere stata generata nuova)

            // VALIDATED DTO ====>  {
            //      message: 'ciao come stai?',
            //      user: User {
            //          id: 'ca61c706-ee8e-49fb-8601-5aaa5c45cda7',
            //          email: 'stella.rubia@mailinator.com',
            //          groups: [ '/Sede', '/Sede/Sistemi Informativi' ],
            //          name: 'Stella Rubia'
            //    }
            // }

            const { stream, sessionId } = await this.chatUseCase.execute(validatedData)

            // Comunichiamo subito la sessione al client (fondamentale per il frontend)
            await sendSSE(reply, { type: 'session_id', content: sessionId })

            for await (const chunk of stream) {
                if (isClosed) break
                await sendSSE(reply, { type: 'token', content: chunk })
            }

            if (!isClosed) {
                await sendSSE(reply, { type: 'done' })
            }
        } catch (error: unknown) {
            request.log.error(error)

            if (error instanceof z.ZodError) {
                return reply.code(400).send({
                    error: 'VALIDATION_ERROR',
                    // 'issues' è il nome corretto della proprietà in Zod
                    details: error.issues,
                })
            }

            // Gestione errori durante lo streaming
            const errorMessage = error instanceof Error ? error.message : 'Errore interno'
            if (!isClosed) {
                await sendSSE(reply, {
                    type: 'error',
                    error: { code: 'CHAT_ERROR', message: errorMessage },
                })
            }
        } finally {
            // Chiudiamo il canale SSE solo se è stato aperto (no errore 400)
            if (reply.raw.writable) {
                reply.raw.end()
            }
        }
    }
}
