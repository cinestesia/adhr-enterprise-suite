import { FastifyRequest, FastifyReply } from 'fastify'
import { ChatUseCase } from '@/application/use-cases/chat.use-case'
import { initSSE, sendSSE } from '@/presentation/http/helpers/sse.helpers'
import { AuthTokenToUserMapper } from '@/mappers/auth-token-to-user.mapper'
import { ChatRequestSchema } from '@/dtos/chat-request.dto'
import { z } from 'zod'

export class ChatController {
    constructor(private chatUseCase: ChatUseCase) {}

    async handleChat(request: FastifyRequest, reply: FastifyReply) {
        let isClosed = false

        try {
            // Utilizziamo un mapper per essere indipendeti dal formato del token e orrtenere un oggetto User di dominio già pronto. Il controller non sa come funziona il token, delega al mapper.
            const userDomain = AuthTokenToUserMapper.toDomain(request.user)

            // Validiamo il dato: un messsaggio di almeno 1 carattere è obbligatorio. 
            // sessionId() è opzionale, se presente deve essere una UUID.
            // user deve essere un'istanza di User (già garantita dal mapper).
            const validatedData = ChatRequestSchema.parse({
                ...(request.body as object),
                user: userDomain
            })

            // Inizializziamo SSE ( Server Side Events)solo dopo che la validazione è passata
            initSSE(reply)

            // Gestione chiusura connessione
            reply.raw.on('close', () => {
                isClosed = true
                request.log.info(`Client disconnected from session: ${validatedData.sessionId}`)
            })

            // Il UseCase ora riceve un contratto solido (il DTO).
            // Restituisce lo stream e la sessionId (che potrebbe essere stata generata nuova)
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
                    details: error.issues 
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