import { IEmbeddingsPort } from '@/domain/ports/embeddings.port'
import { IVectorDbPort, VectorSearchResult } from '@/domain/ports/vector-db.port'
import { Document } from '@langchain/core/documents'
import { DbInstance } from '@/infrastructure/db'
import { documents, documentChunks } from '@/infrastructure/db/schema'
import { sql, eq } from 'drizzle-orm'

export class PgVectorAdapter implements IVectorDbPort {
    constructor(
        private embeddings: IEmbeddingsPort,
        private db: DbInstance
    ) {}

    // src/infrastructure/db/adapters/pgvector.adapter.ts

    async addDocument(chunks: Document[]): Promise<void> {
        const fileName = chunks[0].metadata.source
        const department = chunks[0].metadata.department || 'General'

        await this.db.transaction(async (tx) => {
            // 1. Inserimento record padre
            const [doc] = await tx
                .insert(documents)
                .values({
                    fileName,
                    department,
                })
                .returning()

            // 2. Generazione embeddings
            const contents = chunks.map((c) => c.pageContent)
            const vectors = await this.embeddings.embedDocuments(contents)

            // 3. Preparazione chunk con formattazione VECTOR string
            const chunksToInsert = chunks.map((chunk, index) => {
                // TRUCCO: Convertiamo l'array [0.1, 0.2] in "[0.1, 0.2]"
                const vectorString = `[${vectors[index].join(',')}]`

                return {
                    documentId: doc.id,
                    content: chunk.pageContent,
                    embedding: sql`${vectorString}::vector`, // Ora è una stringa valida per Postgres
                    metadata: chunk.metadata,
                }
            })

            // 4. Inserimento massivo
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
        const queryEmbedding = await this.embeddings.embedQuery(query)
        const vectorString = `[${queryEmbedding.join(',')}]`
        /**
         * sql<number>: È un template tag. Serve per creare dei frammenti di query SQL dinamici
         * mantenendo la sicurezza contro SQL injection. In questo caso, stiamo costruendo una parte della query
         * che calcola la similarità tra il vettore del documento e il vettore della query.
         * per esempio: 1 - (embedding <=> '[0.1, 0.5, -0.2]'::vector) AS similarity
         */
        const similarityScore =
            sql<number>`1 - (${documentChunks.embedding} <=> ${vectorString}::vector)`.as(
                'similarity'
            )

        /**
         * SELECT content, metadata, 1 - (embedding <=> '[0.1, 0.5, -0.2]'::vector) AS similarity
         * FROM document_chunks
         * Se filters.department esiste, aggiunge questa condizione sulla colonna JSONB
         * WHERE metadata->>'department' = 'NomeDipartimento' ORDER BY embedding <=> '[0.1, 0.5, -0.2]'::vector
         * LIMIT 5; -- Supponendo che limit sia 5
         */
        const results = await this.db
            .select({
                content: documentChunks.content,
                metadata: documentChunks.metadata,
                similarity: similarityScore,
            })
            .from(documentChunks)
            .where(
                filters?.department
                    ? eq(
                          sql<string>`${documentChunks.metadata}->>'department'`,
                          filters.department
                      )
                    : undefined
            )
            .orderBy(sql`${documentChunks.embedding} <=> ${vectorString}::vector`)
            .limit(limit)

        // 3. Mapping con cast a string per il content (risolve l'errore 4)
        return results.map((r) => ({
            content: r.content as string, // Cast esplicito da unknown a string
            metadata: (r.metadata ?? {}) as Record<string, any>,
            similarity: Number(r.similarity ?? 0),
        }))
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
            await this.db.delete(documents).where(eq(documents.fileName, sourceName))

            console.log(
                `[PgVectorAdapter] Knowledge base ripulita per la sorgente: ${sourceName}`
            )
        } catch (error) {
            console.error(
                `[PgVectorAdapter] Errore durante la cancellazione di ${sourceName}:`,
                error
            )
            throw new Error(`Impossibile eliminare la conoscenza per: ${sourceName}`)
        }
    }
}
