// apps/ai-backend/src/infrastructure/agent/tools/query-corporate-db.tool.ts
import { ITool } from '@/domain/ports/tool.port'
import { ToolSpecification, ToolExecutionContext } from '@/domain/models/agent.model'

export class QueryCorporateDbTool implements ITool {
    constructor() {} // In futuro qui inietterai il repository o l'istanza del DB (es. Drizzle)

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
                        enum: ['ultimo_mese', 'anno_corrente', 'oggi'],
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
            `[Agent Tool - SQL] Estrazione quantitativa in corso per la metrica "${input.metricType}" nel periodo "${input.period}"...`
        )

        // Mock strutturato per simulare la risposta del database relazionale aziendale
        if (input.metricType === 'ordini') {
            return JSON.stringify(
                [
                    {
                        id_ordine: 'ORD-2026-045',
                        filiale: 'ADHR Bologna',
                        data: '2026-05-12',
                        stato: 'Approvato',
                        importo: '1,450.00 €',
                    },
                    {
                        id_ordine: 'ORD-2026-049',
                        filiale: 'ADHR Milano',
                        data: '2026-05-19',
                        stato: 'In Lavorazione',
                        importo: '3,100.00 €',
                    },
                ],
                null,
                2
            )
        }

        if (input.metricType === 'candidati_attivi') {
            return JSON.stringify(
                {
                    totale_candidati_attivi: 1420,
                    dipartimento: context.department,
                    nota: 'Conteggio aggiornato in tempo reale sul database transazionale.',
                },
                null,
                2
            )
        }

        return `Nessun dato quantitativo trovato per la metrica richiesta (${input.metricType}) nel periodo selezionato.`
    }
}
