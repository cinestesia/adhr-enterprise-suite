import { z } from 'zod';

const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'txt', 'md'];

export const IngestRequestSchema = z.object({
    
    // Controllo del Buffer
    fileBuffer: z.instanceof(Buffer, { 
        message: "Il file deve essere un Buffer valido" 
    })
    .refine((buffer) => buffer.length > 0 && buffer.length <= 10 * 1024 * 1024, {
        message: "Il file è troppo grande. Massimo 10MB"
    }),
    
    // Controllo del nome file + estensione
    fileName: 
        z.string()
        .min(1, "Il nome del file è obbligatorio")
        .trim()
        .refine((name) => {
            // Estraiamo l'estensione (prendiamo tutto ciò che c'è dopo l'ultimo punto)
            const extension = name.split('.').pop()?.toLowerCase();
            return ALLOWED_EXTENSIONS.includes(extension || '');
        }, {
            // Messaggio dinamico che mostra le estensioni permesse
            message: `Formato non supportato. Estensioni permesse: ${ALLOWED_EXTENSIONS.join(', ')}`
        }),
    
    // Controllo del dipartimento
    department: 
        z.string()
        .min(1, "Il dipartimento è obbligatorio")
        .trim()
});

export type IngestRequestDTO = z.infer<typeof IngestRequestSchema>;