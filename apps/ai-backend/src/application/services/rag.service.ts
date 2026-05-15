import { IVectorDbPort } from "@/domain/ports/vector-db.port";

export class RagService {
    private readonly SIMILARITY_THRESHOLD = 0.45
    private readonly MAX_CHUNKS = 4

    constructor(private vectorDb: IVectorDbPort) {}
    
    async getContext(message: string, department: string): Promise<string | null> {
        
        // 1. Ricerca grezza
        const chunks = await this.vectorDb.similaritySearch(message, this.MAX_CHUNKS, { department });

        // 2. Filtro di pertinenza (Logica di business estratta dal Use Case)
        const relevantChunks = chunks.filter(c => c.similarity > this.SIMILARITY_THRESHOLD);

        if (relevantChunks.length === 0) return null;

        // 3. Formattazione del contesto per l'IA
        return relevantChunks
            .map((c) => c.content)
            .join('\n\n---\n\n');
    }
}