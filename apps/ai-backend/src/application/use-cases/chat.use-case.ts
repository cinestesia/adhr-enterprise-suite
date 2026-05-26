import { IChatRepositoryPort } from '@/domain/ports/chat-repository.port'
import { IChatPort } from '@/domain/ports/chat.port'
import { IAgentPort } from '@/domain/ports/agent.port'
import { IterableReadableStream } from '@langchain/core/utils/stream'
import { ChatRequestDTO } from '@/dtos/chat-request.dto'
import { ChatMessage } from '@/domain/models/chat-message.model'
import { ToolExecutionContext } from '@/domain/models/agent.model'
import { SessionService } from '../services/session.service'
import { RagService } from '../services/rag.service'
import { PromptBuilder } from '../services/prompt-builder.service'
import { ChatStreamService } from '../services/chat-stream.service'
import { QueryAnalyzerService } from '../services/query-analyzer.service'

interface ChatUseCaseOutput {
    stream: IterableReadableStream<string>
    sessionId: string
}

export class ChatUseCase {
    constructor(
        private sessionService: SessionService,
        private ragService: RagService,
        private streamService: ChatStreamService,
        private promptBuilder: PromptBuilder,
        private chatRepo: IChatRepositoryPort,
        private aiGateway: IChatPort,
        private agentRegistry: Map<string, IAgentPort>,
        private queryAnalyzer: QueryAnalyzerService
    ) {}

    async execute(dto: ChatRequestDTO): Promise<ChatUseCaseOutput> {
        const { message, user, sessionId: providedId } = dto

        try {
            const { session, isNew } = await this.sessionService.resolve(
                providedId,
                user.id,
                user.mainDepartment
            )
            const history = await this.chatRepo.getMessagesBySessionId(session.id, 10)

            if (isNew || history.length === 0) {
                this.sessionService.generateTitleInBackground(
                    session.id,
                    user.id,
                    message
                )
            }

            await this.chatRepo.saveMessage(session.id, new ChatMessage('user', message))

            const analysis = await this.queryAnalyzer.analyze(message)

            console.log('ANALYSIS:', analysis)

            /**
             * @note
             * analyze utilizza ollama come "cervello" per fare la pulizia
             * del prompt e il routing. Risponde sempre esclusivamente
             * in un formato JSON con la struttura che abbiamo deciso
             * in prompt-builder.
             *
             * Se per esempio chiediamo:
             *
             * "ciao quanti ordini ci sono stati in Febbraio quest'anno?"
             *
             * analysis è:
             *
             * {
             *  route: 'AGENT',
             *  targetAgent: 'itAgent',
             *  optimizedQuery: 'conteggio ordini mese febbraio anno corrente',
             *  filters: { year: null, fileNameKeyword: null }
             * }
             *
             */

            console.log(
                `[Router] Rotta Rilevata: ${analysis.route} | Query: ${analysis.optimizedQuery}`
            )

            /**
             * @note
             * LA ROTTA AGENTICA (Transazionale / Calcoli complessi)
             */
            if (analysis.route === 'AGENT') {
                console.log(
                    `[ChatUseCase] Attivazione Reparto Speciale: Avvio del Loop Agentico Cognitivo...`
                )

                /**
                 * @note
                 * Un tool è un'azione atomica, deterministica e specifica.
                 * Non ha intelligenza propria; è una "funzione" o una "API"
                 * che permette all'AI di interagire con il mondo esterno
                 * (leggere, scrivere, calcolare).
                 * Creiamo un tool ogni volta che l'AI deve fare un'azione
                 * tecnica su un sistema esterno.
                 * Esempi:
                 *
                 * 1.   Leggere i contratti da PostgreSQL
                 * 2.   Scrivere i dati di un candidato dentro l'ATS aziendale via API.
                 * 3.   Inviare una mail di convocazione a un candidato.
                 *
                 */

                const targetAgentName = analysis.targetAgent || 'itAgent'
                const selectedAgent = this.agentRegistry.get(targetAgentName)

                if (!selectedAgent) {
                    throw new Error(
                        `L'agente verticale "${targetAgentName}" non è configurato nel sistema.`
                    )
                }
                // Indipendentemente dall'agente scelto, va passato un contesto
                // di esecuzione del tool per 'agente che dovrà muoversi in tale contesto.
                const executionContext = new ToolExecutionContext(
                    user.mainDepartment,
                    user.id
                )

                /**
                 * @note
                 * Qui ci interfacciamo con il nostro agente in grado di decidere
                 * quali azioni devono essere eseguite per ottenere il risultato.
                 * L'agente in questo caso è un'implementazione che implementa
                 * il "cervello" con ollama, e le sue "braccia" con la programmazione;
                 * infatti è l'agente stesso che si occupa di eseguire l'azione
                 * adeguata richiesta dal "cervello"
                 *
                 * L'agente sa già quali tool (specifiche) ha a disposizione,
                 * quindi non serve più passargli l'array
                 * `availableToolSpecifications` da qui!
                 *
                 */
                const agentResponse = await selectedAgent.run(
                    message,
                    history,
                    executionContext
                )

                await this.chatRepo.saveMessage(
                    session.id,
                    new ChatMessage('assistant', agentResponse.output)
                )

                const agentStream = ReadableStream.from([
                    agentResponse.output,
                ]) as unknown as IterableReadableStream<string>

                return {
                    stream: this.streamService.getWrappedStream(agentStream, session.id),
                    sessionId: session.id,
                }
            }

            // ────────────────────────────────────────────────────────
            // CASO BIVIO 2 & 3: LE ROTTE LINEARI (RAG Standard o GENERIC)
            // ────────────────────────────────────────────────────────

            let context: string | null = ''

            if (analysis.route === 'RAG') {
                context = await this.ragService.getContext(
                    analysis.optimizedQuery,
                    user.mainDepartment,
                    analysis.filters
                )
            }

            const systemContent = this.promptBuilder.buildSystemMessage(
                user.mainDepartment,
                context
            )

            const augmentedHistory = [
                new ChatMessage('system', systemContent),
                ...history,
            ]

            const rawAiStream = await this.aiGateway.chat(message, augmentedHistory)

            return {
                stream: this.streamService.getWrappedStream(rawAiStream, session.id),
                sessionId: session.id,
            }
        } catch (error) {
            console.error("[ChatUseCase] Errore critico durante l'esecuzione:", error)
            throw error
        }
    }
}
