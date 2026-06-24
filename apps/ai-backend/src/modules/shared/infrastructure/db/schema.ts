import {
    pgTable,
    uuid,
    text,
    jsonb,
    timestamp,
    customType,
    index,
    integer,
} from 'drizzle-orm/pg-core'

// se passiamo a OpenAI (text-embedding-3-small), si cambia a 1536.
const EMBEDDING_DIM = 768

const vector = customType<{ data: number[] }>({
    dataType() {
        return `vector(${EMBEDDING_DIM})`
    },
})

// Tabelle documenti ( Il "Padre" )
export const documents = pgTable(
    'documents',
    {
        id: uuid().defaultRandom().primaryKey(),
        fileName: text('file_name').notNull(),
        externalId: text('external_id'),
        department: text('department').notNull(),
        mimeType: text('mime_type'),
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at').defaultNow().notNull(),
    },
    (table) => [index('dept_idx').on(table.department)]
)

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
export const documentChunks = pgTable('documents_chunks', {
    id: uuid().defaultRandom().primaryKey(),

    documentId: uuid('document_id')
        .references(() => documents.id, { onDelete: 'cascade' })
        .notNull(),

    content: text('content').notNull(),
    embedding: vector('embedding').notNull(),
    metadata: jsonb('metadata'),
})

/**
 * @note
 * Perchè abbiamo separato i documenti dai chunks?
 * Se cerchiamo qualcosa e troviamo un chunk rilevante,
 * avere il document_id ci permette di risalire subito al file
 * originale per mostrare all'utente:
 * "Ho trovato questo nel manuale 'Regolamento_Ferie.pdf'".
 */

export const chatSessions = pgTable('chat_sessions', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').notNull(),
    title: text('title').default('Nuova Conversazione'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const chatMessages = pgTable('chat_messages', {
    id: uuid('id').primaryKey().defaultRandom(),

    sessionId: uuid('session_id').references(() => chatSessions.id, {
        onDelete: 'cascade',
    }),

    role: text('role', { enum: ['system', 'user', 'assistant'] }).notNull(),
    content: text('content').notNull(),
    // Salviamo anche i metadati del RAG se vogliamo fare debug dopo
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
})

// NUOVA: Tabella per i feedback degli utenti
export const chatFeedbacks = pgTable(
    'chat_feedbacks',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        messageId: uuid('message_id')
            .references(() => chatMessages.id, { onDelete: 'cascade' })
            .notNull(),
        rating: integer('rating').notNull(), // 1 👍, -1 👎
        comment: text('comment'),
        createdAt: timestamp('created_at').defaultNow().notNull(),
    },
    (table) => [index('msg_feedback_idx').on(table.messageId)]
)

// Nota: Assicurati che l'import di 'vector' (se proviene da un file custom o estensione) sia presente in cima
// Nota architetturale futura: Se il volume dei curricula dovesse crescere sensibilmente 
// (oltre i 10.000/20.000 candidati), potremo aggiungere nell'array degli indici in 
// fondo allo schema anche gli indici vettoriali HNSW (Hierarchical Navigable Small World) 
// su entrambe le colonne utilizzando l'operatore di distanza coseno per mantenere 
// le query sotto i 10 millisecondi. Per adesso, la scansione sequenziale di pgvector 
// gestirà il carico attuale senza battere ciglio.

export const candidates = pgTable(
    'candidates',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        fullName: text('full_name').notNull(),
        email: text('email'),
        phone: text('phone'),
        location: text('location'),

        skills: jsonb('skills').$type<string[]>().default([]).notNull(),
        experience: jsonb('experience')
            .$type<
                Array<{
                    role: string
                    company: string
                    period: string | null
                    description: string | null
                }>
            >()
            .default([])
            .notNull(),
        education: jsonb('education')
            .$type<
                Array<{
                    degree: string
                    institution: string
                    year: string | null
                }>
            >()
            .default([])
            .notNull(),
        languages: jsonb('languages').$type<string[]>().default([]).notNull(),

        cvFileUrl: text('cv_file_url').notNull(),
        
        // 1. Embedding chirurgico (Competenze e ruoli)
        skillsEmbedding: vector('skills_embedding'), 

        // 2. NUOVO: Embedding olistico (Background completo, esperienze narrative e istruzione)
        profileEmbedding: vector('profile_embedding'), 

        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at').defaultNow().notNull(),
    },
    (table) => [
        index('candidate_name_idx').on(table.fullName),
        index('candidate_email_idx').on(table.email),
    ]
)