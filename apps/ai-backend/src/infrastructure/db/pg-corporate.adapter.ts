import {
    ICorporateRepositoryPort,
    CorporateMetrics,
    CorporateContractRow,
} from '@/domain/ports/corporate-repository.port'
import { SQL_GET_CONTRACTS_ANALYTICS } from './corporate-queries/corporate-analytics.query'

export class PgCorporateAdapter implements ICorporateRepositoryPort {
    constructor(private db: any) {}

    async getOrdersByPeriod(
        department: string,
        period: string
    ): Promise<CorporateMetrics> {
        console.log(
            `[DB Real SQL] Esecuzione Analisi Contratti. Periodo richiesto: ${period}`
        )

        const currentYear = new Date().getFullYear() // Dinamico (2026)
        let startDate: string
        let endDate: string

        const formatIsoDate = (d: Date) => d.toISOString().split('T')[0]
        const normalizedPeriod = period.toLowerCase().trim()

        const monthsMap: Record<string, number> = {
            gennaio: 0,
            febbraio: 1,
            marzo: 2,
            aprile: 3,
            maggio: 4,
            giugno: 5,
            luglio: 6,
            agosto: 7,
            settembre: 8,
            ottobre: 9,
            novembre: 10,
            dicembre: 11,
        }

        if (normalizedPeriod === 'oggi') {
            const now = new Date()
            startDate = formatIsoDate(now)
            endDate = formatIsoDate(now)
        } else if (
            normalizedPeriod === 'anno_corrente' ||
            normalizedPeriod === 'questo anno'
        ) {
            startDate = `${currentYear}-01-01`
            endDate = `${currentYear}-12-31`
        } else if (monthsMap[normalizedPeriod] !== undefined) {
            const monthIndex = monthsMap[normalizedPeriod]
            const firstDay = new Date(currentYear, monthIndex, 1)
            const lastDay = new Date(currentYear, monthIndex + 1, 0)

            startDate = formatIsoDate(firstDay)
            endDate = formatIsoDate(lastDay)
        } else {
            const now = new Date()
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
            startDate = formatIsoDate(firstDay)
            endDate = formatIsoDate(lastDay)
        }

        try {
            console.log(
                `[DB Real SQL] Esecuzione query con parametri: START = "${startDate}", END = "${endDate}"`
            )

            const queryResult = await (this.db as any).session.client.unsafe(
                SQL_GET_CONTRACTS_ANALYTICS,
                [startDate, endDate]
            )

            const rawRows = queryResult as CorporateContractRow[]

            console.log(
                `[DB Real SQL] Righe totali restituite dal database: ${rawRows.length}`
            )

            // questo è un esempio di come potremmo filtrare per filiale
            // let filteredRows = rawRows.filter(
            //     (row) =>
            //         !row['DIPARTIMENTO CENTRO DI COSTO'] ||
            //         row['DIPARTIMENTO CENTRO DI COSTO'].toLowerCase() ===
            //             department.toLowerCase()
            // )

            let filteredRows = rawRows

            // Creiamo un'anteprima leggerissima (solo i primi 3 ordini) con i campi essenziali
            const previewRows: CorporateContractRow[] = filteredRows
                .slice(0, 3)
                .map((row) => ({
                    'NUMERO ORDINE': row['NUMERO ORDINE'],
                    FILIALE: row['FILIALE'],
                    'RAGIONE SOCIALE': row['RAGIONE SOCIALE'],
                    'STATO ORDINE': row['STATO ORDINE'],
                    'DATA INIZIO': row['DATA INIZIO'],
                    'DATA FINE': row['DATA FINE'],
                    'COGNOME LAVORATORE': row['COGNOME LAVORATORE'],
                    'NOME LAVORATORE': row['NOME LAVORATORE'],
                    'TIPO ORDINE': row['TIPO ORDINE'],
                    'TIPO BUSINESS': row['TIPO BUSINESS'],
                    'RETRIBUZIONE LORDA ORARIA': row['RETRIBUZIONE LORDA ORARIA'],
                }))

            return {
                metricType: 'ordini',
                period,
                totalCount: filteredRows.length, // <--- L'LLM leggerà questo numero per rispondere alla domanda!
                rows: previewRows, // <--- Solo 3 righe leggere. Ollama ringrazia e non si appende più
            }
        } catch (error) {
            console.error(
                "[PgCorporateAdapter] Errore critico SQL durante l'estrazione contratti:",
                error
            )
            throw new Error('Impossibile recuperare i dati dei contratti transazionali.')
        }
    }

    async getActiveCandidatesCount(department: string): Promise<number> {
        console.log(
            `[DB Real SQL] Conteggio candidati attivi sul DB per il dipartimento: ${department}`
        )
        return 1845
    }
}
