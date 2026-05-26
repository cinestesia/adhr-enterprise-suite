import { User } from '@/domain/models/user.model'
import { z } from 'zod'

export const BaseChatRequestSchema = z.object({
    message: z
        .string()
        .min(1, 'Il messaggio è obbligatorio')
        .describe("Il messaggio inviato dall'utente"),
    sessionId: z.string().uuid().optional().describe('ID della sessione esistente'),
})

/**
 * @note Schema Completo (Application DTO)
 * Estende lo schema di base aggiungendo l'obbligatorietà dell'oggetto User.
 * Questo è quello che userai nel Controller per validare il pacchetto finale.
 */
export const ChatRequestSchema = BaseChatRequestSchema.extend({
    user: z.instanceof(User, {
        message: "L'utente deve essere un'istanza valida del dominio",
    }),
})

export type ChatRequestDTO = z.infer<typeof ChatRequestSchema>
