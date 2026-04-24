import { IEmbeddingsPort } from "@/domain/ports/embeddings.port"
import { IVectorDbPort, VectorSearchResult } from "@/domain/ports/vector-db.port"
import { Document } from "@langchain/core/documents"
import { db } from "@/infrastructure/db"
import { documents, documentChunks } from "@/infrastructure/db/schema"
import { sql, eq } from "drizzle-orm"

export class PgVectorAdapter implements IVectorDbPort {
    
    constructor (private embeddings: IEmbeddingsPort){}
    
    async addDocument(chunks: Document[]): Promise<void> {
        // 1. Estraiamo i metadati comuni solo dal primo chunk (es. fileName, department)
        const fileName =  chunks[0].metadata.source
        const department = chunks[0].metadata.department || 'General';

        await db.transaction(async (tx) => {
            // 2. Creiamo il record del Documento "Padre"
            const [doc] = await tx.insert(documents).values({
                fileName, 
                department
            }).returning()
            
            // 3. Generiamo gli embeddings per tutti i chunk
            // NOTA: In produzione conviene processarli in batch se sono molti
            const contents = chunks.map(c => c.pageContent)
            const vectors = await this.embeddings.embedDocuments(contents);
            // 4. Prepariamo l'inserimento massivo dei chunk    
            const chunksToInsert = chunks.map((chunk, index) => ({
                documentId: doc.id,
                content: chunk.pageContent,
                embedding: vectors[index],
                metadata: chunk.metadata,
            }))

            await tx.insert(documentChunks).values(chunksToInsert)
        })
        
    }
    
    /**
     *   @similarity
     *   | Caso     | distanza `<=>` | similarity |
     *   | -------- | -------------- | ---------- |
     *   | identico | 0.0            | 1.0        |
     *   | simile   | 0.2            | 0.8        |
     *   | diverso  | 0.9            | 0.1        |
     *   
     */
    async similaritySearch(
        query: string, 
        limit: number = 4, 
        filters?: Record<string, any>
    ): Promise<VectorSearchResult[]> {
        const queryEmbedding = await this.embeddings.embedQuery(query);
        const vectorString = `[${queryEmbedding.join(',')}]`;

        // 1. Usiamo sql.raw o sql con cast esplicito per la similarità
        const similarityScore = sql<number>`1 - (${documentChunks.embedding} <=> ${vectorString}::vector)`.as('similarity');

        // 2. Query - Usiamo una sintassi più esplicita
        const results = await db
            .select({
                content: documentChunks.content,
                metadata: documentChunks.metadata,
                similarity: similarityScore,
            })
            .from(documentChunks)
            .where(
                filters?.department 
                    ? eq(sql<string>`${documentChunks.metadata}->>'department'`, filters.department)
                    : undefined
            )
            .orderBy(sql`${documentChunks.embedding} <=> ${vectorString}::vector`)
            .limit(limit);

        // 3. Mapping con cast a string per il content (risolve l'errore 4)
        return results.map(r => ({
            content: r.content as string, // Cast esplicito da unknown a string
            metadata: (r.metadata ?? {}) as Record<string, any>,
            similarity: Number(r.similarity ?? 0)
        }));
    }


    /**
     * @note
     * Immagina questo scenario:
     * Carichi Manuale_IT_v1.pdf. Il database si riempie di vettori.
     * Ti accorgi di un errore, correggi il PDF e lo ricarichi come Manuale_IT_v1.pdf.
     * Senza questo metodo, avresti due copie di ogni informazione. Il bot potrebbe 
     * rispondere usando dati obsoleti o, peggio, darti due risposte contrastanti.
     * Implementando deleteBySource, lo Use Case di ingestione può fare un "clean & replace":
     * Controlla se il file esiste già.
     * Se sì, chiama deleteBySource.
     * Carica i nuovi vettori.
     * 
     */
    
    async deleteBySource(sourceName: string): Promise<void> {
        // 1. Cerchiamo il documento nella tabella 'documents' tramite il nome file
        // 2. Cancellando il record padre, Postgres (grazie al CASCADE) 
        //    eliminerà istantaneamente tutti i chunk collegati nella tabella 'documents_chunks'
        try {
            await db.delete(documents)
                .where(eq(documents.fileName, sourceName));
            
            console.log(`[PgVectorAdapter] Knowledge base ripulita per la sorgente: ${sourceName}`);
        } catch (error) {
            console.error(`[PgVectorAdapter] Errore durante la cancellazione di ${sourceName}:`, error);
            throw new Error(`Impossibile eliminare la conoscenza per: ${sourceName}`);
        }
    }
}