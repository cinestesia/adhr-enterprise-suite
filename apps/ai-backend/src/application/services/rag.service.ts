import { IVectorDbPort, VectorSearchFilters } from '@/domain/ports/vector-db.port'
import { QueryAnalysisResult } from './query-analyzer.service'

export class RagService {
    private readonly SIMILARITY_THRESHOLD = 0.45
    private readonly MAX_CHUNKS = 4

    constructor(private vectorDb: IVectorDbPort) {}

    async getContext(
        message: string,
        department: string,
        dynamicFilters?: Omit<VectorSearchFilters, 'department'>
    ): Promise<string | null> {
        const combinedFilters = {
            department,
            ...dynamicFilters,
        }

        const chunks = await this.vectorDb.similaritySearch(
            message,
            this.MAX_CHUNKS,
            combinedFilters
        )

        const relevantChunks = chunks.filter(
            (c) => c.similarity > this.SIMILARITY_THRESHOLD
        )

        if (relevantChunks.length === 0) return null

        return relevantChunks.map((c) => c.content).join('\n\n---\n\n')
    }
}
