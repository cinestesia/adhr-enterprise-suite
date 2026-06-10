import { PromptBuilder } from './prompt-builder.service'
import { IAiGatewayPort } from '../../domain/ports/ai-gateway.port'
import { KnowledgeBaseSearchFilters } from '@/modules/shared/domain/ports/knowledge-base.port'

export interface QueryAnalysisResult {
    route: 'RAG' | 'GENERIC' | 'AGENT'
    targetAgent?: 'itAgent' 
    optimizedQuery: string
    filters?: Omit<KnowledgeBaseSearchFilters, 'department'>
}

export class QueryAnalyzerService {
    constructor(
        private aiGateway: IAiGatewayPort,
        private promptBuilder: PromptBuilder
    ) {}

    /**
     * @note
     * Analizziamo il prompt per fare routing avanzato (Intento e Agente Target).
     * Oltre a decidere la macro-rotta (RAG, GENERIC, AGENT), se la rotta è AGENT
     * determiniamo quale "cervello" verticale deve prendere in carico la richiesta.
     */

    async analyze(message: string): Promise<QueryAnalysisResult> {
        try {
            const prompt = this.promptBuilder.buildQueryAnalysisPrompt(message)
            const rawResponse = await this.aiGateway.predict(prompt)
            const jsonStart = rawResponse.indexOf('{')
            const jsonEnd = rawResponse.lastIndexOf('}')

            if (jsonStart === -1 || jsonEnd === -1) {
                return { route: 'GENERIC', optimizedQuery: message }
            }

            const jsonString = rawResponse.substring(jsonStart, jsonEnd + 1)
            const parsed = JSON.parse(jsonString)

            // Prepariamo i contenitori per il UseCase
            let finalRoute: 'RAG' | 'GENERIC' | 'AGENT' = 'GENERIC'
            let finalTargetAgent: 'itAgent' | 'recruitingAgent' | undefined = undefined

            // Mappiamo lo schema piatto del prompt nell'architettura multi-agente
            if (parsed.route === 'AGENT_IT') {
                finalRoute = 'AGENT'
                finalTargetAgent = 'itAgent'

            // } else if (parsed.route === 'AGENT_RECRUITING') {
            //     finalRoute = 'AGENT'
            //     finalTargetAgent = 'recruitingAgent'
            
            } else if (parsed.route === 'RAG') {
                finalRoute = 'RAG'
            }

            return {
                route: finalRoute,
                targetAgent: finalTargetAgent,
                optimizedQuery: parsed.optimizedQuery || message,
                filters: parsed.filters,
            }
        } catch (error) {
            console.error(
                "[QueryAnalyzerService] Errore durante l'analisi, vado in fallback:",
                error
            )
            return { route: 'RAG', optimizedQuery: message }
        }
    }
}
