// apps/ai-backend/src/infrastructure/agent/tools/query-corporate-db.tool.ts
import { ITool } from '@/domain/ports/tool.port'
import { ToolSpecification, ToolExecutionContext } from '@/domain/models/agent.model'
import { ICorporateRepository } from '@/domain/ports/corporate-repository.port'

export class QueryCorporateDbTool implements ITool {
    // Iniezione del Porto di Dominio! Rispettiamo in pieno la Clean Architecture
    constructor(private corporateRepo: ICorporateRepository) {}

    get specification(): ToolSpecification {
        return {
            name: 'queryCorporateDatabase',
            description:
                "Utilizza questo strumento SOLO quando l'utente richiede esplicitamente dati quantitativi vivi, statistiche numeriche, liste di ordini recenti delle filiali, trend di fatturato o conteggi memorizzati nel database aziendale.",
            input_schema: {
                type: 'object',
                properties: {
                    metricType: {
                        type: 'string',
                        description:
                            "Il tipo di metrica quantitativa richiesta dall'utente.",
                        enum: ['ordini', 'fatturato', 'candidati_attivi'],
                    },
                    period: {
                        type: 'string',
                        description:
                            'Il periodo temporale di riferimento per il calcolo.',
                        // Ho eliminato enum perchè ad esempio se gli chiedo il mese di febbraio
                        // lui non trova niente in questo enum e va a scegiere ultimo_mese
                        // enum: ['ultimo_mese', 'anno_corrente', 'oggi'],
                    },
                },
                required: ['metricType', 'period'],
            },
        }
    }

    async execute(
        input: { metricType: string; period: string },
        context: ToolExecutionContext
    ): Promise<string> {
        console.log(
            `[Agent Tool - SQL] Invocazione repository transazionale per metrica "${input.metricType}"...`
        )

        // Sicurezza aziendale multi-tenant: passiamo il dipartimento dell'utente per filtrare i dati a monte!
        if (input.metricType === 'ordini') {
            const data = await this.corporateRepo.getOrdersByPeriod(
                context.department,
                input.period
            )
            return JSON.stringify(data, null, 2)
        }

        if (input.metricType === 'candidati_attivi') {
            const count = await this.corporateRepo.getActiveCandidatesCount(
                context.department
            )
            return JSON.stringify(
                {
                    totale_candidati_attivi: count,
                    dipartimento: context.department,
                    periodo: input.period,
                    info: 'Dato estratto in tempo reale dal database relazionale di produzione.',
                },
                null,
                2
            )
        }

        return `Nessun dato quantitativo trovato per la metrica richiesta (${input.metricType}) nel periodo selezionato.`
    }
}
