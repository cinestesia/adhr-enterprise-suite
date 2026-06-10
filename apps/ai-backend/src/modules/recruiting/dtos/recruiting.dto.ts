import { z } from 'zod'

// Schema per la Fase 2: La conferma e salvataggio dei dati validati dall'operatore
export const ConfirmSaveCandidateSchema = z.object({
    personalData: z.object({
        fullName: z.string().min(1, 'Il nome completo è obbligatorio'),
        email: z.string().email().nullable(),
        phone: z.string().nullable(),
        location: z.string().nullable(),
    }),
    skills: z.array(z.string()),
    experience: z.array(
        z.object({
            role: z.string(),
            company: z.string(),
            period: z.string().nullable(),
            description: z.string().nullable(),
        })
    ),
    education: z.array(
        z.object({
            degree: z.string(),
            institution: z.string(),
            year: z.string().nullable(),
        })
    ),
    languages: z.array(z.string()),
    // Conserviamo il nome del file temporaneo per ripescarlo dal mapper o caricarlo
    temporaryFileName: z.string().min(1),
})

export type ConfirmSaveCandidateDTO = z.infer<typeof ConfirmSaveCandidateSchema>
