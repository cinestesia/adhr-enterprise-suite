export interface CorporateContractRow {
    'DATA INIZIO': string
    'DATA FINE': string
    FILIALE: string
    'NUMERO ORDINE': number
    'RAGIONE SOCIALE': string
    'COGNOME LAVORATORE': string
    'NOME LAVORATORE': string
    'STATO ORDINE': string
    'TIPO ORDINE': string
    'TIPO BUSINESS': string
    'RETRIBUZIONE LORDA ORARIA': string
    [key: string]: any // Permette di mappare flessibilmente le altre colonne della macro query
}

export interface CorporateMetrics {
    metricType: string
    period: string
    totalCount: number
    rows: CorporateContractRow[]
}

export interface ICorporateRepositoryPort {
    getOrdersByPeriod(department: string, period: string): Promise<CorporateMetrics>
    getActiveCandidatesCount(department: string): Promise<number>
}
