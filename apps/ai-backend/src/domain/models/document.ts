import { z } from 'zod'
/**
 * Esempi validi:
 *
 * {
 *      source: "manuale.pdf",
 *      page: 12
 * }
 *
 *
 * {
 *      source: "https://example.com",
 *      author: "Mario Rossi",
 *      timestamp: "2026-04-20",
 *      relevanceScore: 0.92
 * }
 *
 */
export const DocumentMetadataSchema = z
    .object({
        source: z.string(), // obbligatorio
        page: z.number().optional, // opzionale
    })
    .catchall(z.any()) // permette altri campi extra , senza errori di validazione.

// Documento processato che finisce nel vector db
export const ProcessedDocumentSchema = z.object({
    id: z.string().uuid().optional(),
    content: z.string().min(1),
    metadata: DocumentMetadataSchema,
})

// Richiesta che arriva dal frontend ( via JSON o Multipart )
// Per ora ipotizziamo che il client invii un testo semplice per testare il flusso
export const IngestRequestSchema = z.object({
    text: z.string().min(10, 'Il testo è troppo corto per essere indicizzato'),
    fileName: z.string().min(1),
})

export type DocumentMetadata = z.infer<typeof DocumentMetadataSchema>
export type ProcessedDocument = z.infer<typeof ProcessedDocumentSchema>
export type IngestRequest = z.infer<typeof IngestRequestSchema>
