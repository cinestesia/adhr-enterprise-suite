import { ProcessedDocument } from '../models/document'

export interface IVectorDbPort {
    saveDocuments(documents: ProcessedDocument[]): Promise<void>
    searchSimilar(query: string, limit: number): Promise<ProcessedDocument[]>
}
