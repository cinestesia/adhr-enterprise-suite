import { Document } from '@langchain/core/documents'

/**
 * In produzione non posso salvare solo vettore. Servono
 * i metadati strutturati. Se un HR Manager carica un file
 * il sistema deve sapere chi lo ha caricato a quale categoria
 * appartiene e se è ancora valido.
 *
 * Il know-how è organizzato per **segmentazione** Non vogliamo
 * che un dipendente chieda "Come si resetta la password?"
 * e riceva come risposta un pezzo del "Manuale della Macchina del Caffè".
 *
 * 1.   Namespace/Tenancy: Organizziamo i documenti per topic o department.
 * 2.   Filtri Metadati: Quando l'agente interroga il database, non cerca in "tutto il mondo",
 *      ma aggiunge un filtro SQL: WHERE metadata->>'department' = 'IT'.
 *
 *
 */

export interface KnowledgeBaseSearchFilters {
    department?: string
    year?: number
    fileNameKeyword?: string
}

export interface  KnowledgeBaseSearchResult {
    content: string
    metadata: Record<string, any>
    similarity: number
}


/**
 * Qui modelliamo l'interfaccia per la 
 * gestione del knowledge base basata su vettori (RAG)
 * La conoscenza è organizzata in "Documenti" che vengono chunkizzati e indicizzati con i loro embedding.
 */
export interface IKnowledgeBasePort {
    /**
     * salva una lista di chunk nel database.
     * Il metodo si occupa di generare gli embeddings
     * tramite il provider deciso.
     */
    addDocument(chunks: Document[]): Promise<void>

    /**
     * Il parametro filters nel metodo similaritySearch
     * permette di isolare la conoscenza:
     * "Cerca solo nei documenti dove department === 'HR'".
     *
     * Cerca i chunk più simili a una query testuale.
     * @param query Il testo della domanda dell'utente.
     * @param limit Numero di risultati da restituire (default top 4).
     * @param filters Filtri opzionali (es. per dipartimento o ID documento).
     */

    similaritySearch(
        query: string,
        limit?: number,
        filters?: KnowledgeBaseSearchFilters
    ): Promise<KnowledgeBaseSearchResult[]>

    /**
     * Rimuove tutti i chunk associati a un specifico file.
     * Indispensabile per aggiornare i documenti senza duplicare
     * la conoscenza. Senza deleteBySource, se l'HR Manager
     * carica due volte lo stesso manuale corretto, il bot
     * darebbe risposte duplicate o contrastanti.
     */
    deleteBySource(sourceName: string): Promise<void>
}

/**
 * @note
 * Quando passeremo alla logica del Chatbot, l'Agente utilizzerà questo Porto attraverso un Tool.
 * L'utente chiede: "Quanti giorni di ferie ho?"
 * L'Agente capisce che deve cercare nei documenti.
 * Chiama il vectorDb.similaritySearch("policy ferie", 3, { department: 'HR' }).
 * Riceve i chunk, li inserisce nel prompt e risponde in modo accurato.
 *
 */
