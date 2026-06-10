// src/presentation/http/chat.routes.ts
import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { BaseChatRequestSchema } from '@/modules/chat/dtos/chat-request.dto'
import { z } from 'zod'
import { ChatSessionsListResponseSchema } from '@/modules/chat/dtos/chat-sessions-response.dto'
import { ChatHistoryListResponseSchema } from '@/modules/chat/dtos/chat-history-response.dto'
import { ValidationErrorResponseSchema, ForbiddenErrorResponseSchema } from '@/modules/chat/dtos/chat-error-response.dto'

export async function chatRoutes(
    fastify: FastifyInstance,
    _options: FastifyPluginOptions
) {
    // 1. POST - Streaming Chat
    fastify.post(
        '/chat',
        {
            onRequest: [fastify.authenticate],
            schema: {
                summary: 'Invia un messaggio e attiva l’orchestrazione cognitiva (SSE Stream)',
                description: [
                    'Invia un prompt utente per avviare un’interazione. Il controller valida i dati, sanifica i campi extra ed esegue il routing intelligente.',
                    '',
                    '### 🧠 Flusso del Router AI (QueryAnalyzerService):',
                    'L’LLM analizza la richiesta a runtime e decide la rotta ottimale restituendo un payload JSON interno strutturato:',
                    '- **`AGENT`**: Attiva un loop cognitivo a grafo su un agente verticale specifico (es. `itAgent`). Esegue tool atomici, deterministici e strutturati nel contesto del dipartimento utente.',
                    '- **`RAG`**: Attiva il recupero documentale tramite PgVector (Similarity Search con richiesta di tolleranza > 0.45 per evitare allucinazioni) filtrando per dipartimento.',
                    '- **`GENERIC`**: Risposta conversazionale standard basata sulla history e sul prompt di sistema.',
                    '',
                    '### 📟 Eventi emessi nello Stream (Server-Sent Events):',
                    '- `type: "session_id"` : Emesso immediatamente per comunicare l’ID sessione (esistente o nuova).',
                    '- `type: "token"` : Emesso in modo continuo per i chunk di testo generati.',
                    '- `type: "done"` : Emesso al completamento corretto dello stream.',
                    '- `type: "error"` : Emesso in caso di eccezioni a runtime durante l’erogazione dello stream.'
                ].join('\n'),
                tags: ['Chat'],
                body: BaseChatRequestSchema,
                response: {
                    200: z.string().describe(
                        'Flusso Server-Sent Events (text/event-stream) contenente eventi JSON strutturati (session_id, token, done, error).'
                    ),
                    400: ValidationErrorResponseSchema
                }
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
                summary: 'Recupera la cronologia messaggi di una specifica sessione',
                description: [
                    'Esegue il caso d’uso `GetChatHistoryUseCase` per recuperare i messaggi della sessione passata in input.',
                    '',
                    '### 🔒 Politiche di Sicurezza e Limitazioni:',
                    '1. **Controllo di Esistenza**: Se la sessione non esiste a database, l’accesso viene negato.',
                    '2. **Verifica di Ownership (`isOwnedBy`)**: Il sistema confronta l’ID dell’utente autenticato (estratto dal JWT) con il proprietario della sessione. Se non coincidono, il controller blocca la richiesta sollevando un errore `403 Forbidden`.',
                    '3. **Paginazione/Cap di Sicurezza**: Per preservare le prestazioni del database e della memoria di contesto, la rotta restituisce un **massimo di 50 messaggi** (gli ultimi in ordine cronologico).'
                ].join('\n'),
                tags: ['Chat'],
                params: z.object({
                    sessionId: z.string().uuid().describe('L’identificativo univoco UUID della sessione di chat da consultare'),
                }),
                response: {
                    200: ChatHistoryListResponseSchema,
                    403: ForbiddenErrorResponseSchema
                }
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
                summary: 'Recupera tutte le sessioni di chat dell’utente loggato',
                description: [
                    'Esegue il caso d’uso `GetUserSessionsUseCase` per recuperare lo storico complessivo delle conversazioni create dall’utente corrente.',
                    '',
                    '### 🛠️ Processamento e Trattamento Dati:',
                    '- L’identificativo utente viene ricavato in modo sicuro lato server tramite il token fornito nell’hook `onRequest`.',
                    '- I dati grezzi estratti dal database vengono mappati e normalizzati dal `ChatViewMapper` per esporre esclusivamente la struttura definita nel DTO di risposta, omettendo metadati interni o relazioni pesanti.'
                ].join('\n'),
                tags: ['Chat'],
                response: {
                    200: ChatSessionsListResponseSchema
                }
            }
        },
        fastify.chatController.getSessions.bind(fastify.chatController)
    )
}