// apps/ai-backend/src/infrastructure/agent/tools/search-faqs.tool.ts
import { ITool } from '@/domain/ports/tool.port'
import { ToolSpecification, ToolExecutionContext } from '@/domain/models/agent.model'
import { RagService } from '@/application/services/rag.service'

export class SearchFaqsTool implements ITool {
    // Iniettiamo il tuo Application Service esistente
    constructor(private ragService: RagService) {}

    get specification(): ToolSpecification {
        return {
            name: 'searchCompanyFaqs',
            description:
                "Utilizza questo strumento esclusivamente quando l'utente fa domande informative su procedure operative, FAQ, manuali tecnici aziendali o dettagli normativi relativi alle piattaforme di ADHR Group (InRecruiting, CARM, ecc.).",
            input_schema: {
                type: 'object',
                properties: {
                    query: {
                        type: 'string',
                        description:
                            'La query ottimizzata in linguaggio naturale per la ricerca semantica (es. "modificare email candidato").',
                    },
                    fileNameKeyword: {
                        type: 'string',
                        description:
                            'Parola chiave estratta dal nome del file se menzionata esplicitamente (es. "manuale_carm"), altrimenti null.',
                    },
                    year: {
                        type: 'number',
                        description:
                            "L'anno specifico menzionato dall'utente (es. 2026), altrimenti null.",
                    },
                },
                required: ['query'],
            },
        }
    }

    async execute(
        input: { query: string; fileNameKeyword?: string; year?: number },
        context: ToolExecutionContext
    ): Promise<string> {
        console.log(
            `[Agent Tool - RAG] Esecuzione ricerca semantica per conto dell'agente...`
        )

        const dynamicFilters = {
            fileNameKeyword: input.fileNameKeyword || undefined,
            year: input.year || undefined,
        }

        // Chiamiamo il tuo RagService applicativo passandogli i filtri strutturati
        const contextText = await this.ragService.getContext(
            input.query,
            context.department,
            dynamicFilters
        )

        if (!contextText || contextText.trim().length === 0) {
            return 'Nessuna informazione rilevante trovata nei manuali di dipartimento per questa specifica richiesta.'
        }

        return contextText
    }
}
