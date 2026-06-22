import { z } from 'zod'

export const ChatMessageResponseSchema = z.object({
    role: z
        .enum(['system', 'user', 'assistant'])
        .describe('Il ruolo del mittente del messaggio'),
    content: z.string().describe('Il contenuto testuale del messaggio'),
    createdAt: z.coerce.string().optional().describe('Data di creazione in formato ISO'),
})

export const ChatHistoryListResponseSchema = z.array(ChatMessageResponseSchema)
