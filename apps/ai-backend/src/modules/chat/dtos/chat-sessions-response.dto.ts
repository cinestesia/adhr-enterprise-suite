import { z } from 'zod'

export const ChatSessionResponseSchema = z.object({
    id: z.string().uuid(),
    userId: z.string(),
    title: z.string(),
    createdAt: z.coerce.string(), // Verrà serializzato come stringa ISO
})

// Schema per l'array di sessioni
export const ChatSessionsListResponseSchema = z.array(ChatSessionResponseSchema)

// Tipo TypeScript per l'autocompletamento
export type ChatSessionResponse = z.infer<typeof ChatSessionResponseSchema>
