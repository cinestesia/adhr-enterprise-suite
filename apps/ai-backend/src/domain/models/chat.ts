/**
 * Questo è uno schema di validazione e definisce cosa entra e cosa
 * esce dal sistema..
 */
import { z } from 'zod' 

// Ogni volta che l'utente invia un messaggio, oppure l'IA risponde,
// creiamo un oggetto di questo tipo.

export const MessageSchema = z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
})

// Esportiamo il tipo TypeScript derivato dallo schema
export type Message = z.infer<typeof MessageSchema>

// Definiamo la richiesta che arriverà dal frontend
export const ChatRequestSchema = z.object({
    messages: z.array(MessageSchema), // Il client manda l'intero array aggiornato
})

export type ChatRequest = z.infer<typeof ChatRequestSchema>
