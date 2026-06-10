import { z } from 'zod'

// Schema per gli errori di validazione (400)
export const ValidationErrorResponseSchema = z.object({
    error: z.string().describe('Codice errore: VALIDATION_ERROR'),
    details: z.array(z.any()).describe('Elenco delle violazioni dei vincoli dello schema Zod')
})

// Schema per gli errori di autorizzazione (403)
export const ForbiddenErrorResponseSchema = z.object({
    error: z.string().describe('Codice errore: FORBIDDEN'),
    message: z.string().describe('Messaggio di dettaglio sull’errore di autorizzazione')
})