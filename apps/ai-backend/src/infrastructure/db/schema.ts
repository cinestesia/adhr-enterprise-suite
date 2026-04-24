import { pgTable, uuid, text, jsonb, timestamp, customType } from 'drizzle-orm/pg-core'

const EMBEDDING_DIM = 768;

const vector = customType<{ data: number[] }>({
  dataType() {
    return `vector(${EMBEDDING_DIM})`;
  },
})

// Tabelle documenti ( Il "Padre" )
export const documents = pgTable('documents', {
    id: uuid().defaultRandom().primaryKey(),
    fileName: text('file_name').notNull(),
    externalId: text('external_id'), // ID utile se i file arrivano da sistemi esterni come SharePoint
    department: text('department').notNull(),
    mimeType: text('mime_type'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

/**
 * Tabella dei chunk  ( I "Figli" del "Padre" con i relativi vettori )
 * 
 * @note
 * 
 * { onDelete: 'cascade' }
 * 
 * Se l'HR Manager decide di cancellare il documento "Manuale 2023"
 * ancellando la riga nella tabella documents, Postgres eliminerà automaticamente 
 * tutti i migliaia di vettori associati nella tabella chunks
 * 
 * jsonb('metadata'): 
 * Usiamo jsonb invece di json perché è indicizzabile su Postgres. Se in futuro si vorrà 
 * filtrare velocemente per "tutti i chunk che appartengono al Capitolo 5", 
 * lo si potrà fare con una query SQL performante.
 * 
 * I metadata saranno qualcosa del tipo:
 * 
 *"metadata": {
 *   "source": "faq_assistenza_inrecruiting.docx",
 *   "blobType": "",
 *   "ingestedAt": "2026-04-24T10:40:24.333Z", <== Potremmo non utilizzarlo, ho createdAt del documento
 *   "loc": {
 *     "lines": {
 *       "from": 1,
 *       "to": 17
 *     }
 *   }
 * }
 *      
 */
export const documentChunks = pgTable("documents_chunks", {
    
    id: uuid().defaultRandom().primaryKey(),
    
    documentId: uuid('document_id')
        .references(() => documents.id, { onDelete: 'cascade' })
        .notNull(),
    
    content: text('content').notNull(),
    embedding: vector('embedding').notNull(),
    metadata: jsonb('metadata') 

})

/**
 * @note
 * Perchè abbiamo separato i documenti dai chunks?
 * Se cerchiamo qualcosa e troviamo un chunk rilevante, 
 * avere il document_id ci permette di risalire subito al file 
 * originale per mostrare all'utente: 
 * "Ho trovato questo nel manuale 'Regolamento_Ferie.pdf'".
 */