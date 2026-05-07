import { FastifyRequest, FastifyReply } from 'fastify'
import { IngestFileUseCase } from '@/application/use-cases/ingest-file.use-case'
import { FileMapper } from '@/mappers/file.mapper' // Assicurati che il percorso sia corretto
import { IngestRequestSchema } from '@/dtos/ingest-request.dto'
import { z } from 'zod'

/**
 * @note
 * I DTO ( Data Transfer Object ) sono oggetti che definiscono l'input dei casi d'uso. 
 * Solitamente appartengono al layer Application. 
 * 
 * Il controller di Presentation, si occupa di prendere i dati che arrivano dalle richieste di un client
 * HTTP e raccogliere i dati dal body della request, dai parametri, dal token ecc..  validarli e impacchettarli
 * dentro il DTO. 
 * 
 * In caso i dati in ingresso siano non validi, il controller si occupa di restituire un errore al client.
 * come 400 Bad Request oppure 500 Internal Server Error, con un messaggio che spiega cosa è andato storto.  
 * 
 * I generale i Mapper mappano da httop grapql, da multipart/form-data, da token JWT ecc.. verso i DTO. 
 * In alcuni casi possono anche mappare da DTO verso modelli di dominio, ma in questo caso specifico, 
 * il controller si occupa solo di mappare i dati in ingresso verso il DTO.
 * 
 */
export class IngestController {
    constructor(private ingestFileUseCase: IngestFileUseCase) {}

    async handleUpload(request: FastifyRequest, reply: FastifyReply) {
        const data = await request.file()

        if (!data) {
            return reply.status(400).send({ error: 'Nessun file caricato' })
        }

        try {
            const rawDTO = await FileMapper.toIngestDTO(data)
            // Passiamo l'oggetto a Zod
            // Se fallisce, lancia un'eccezione che cattureremo nel catch sotto
            // Controlliamo che il file sia un buffer valido, che non sia troppo grande, 
            // che abbia un nome e un'estensione valida e che abbia un dipartimento associato
            const validatedDTO = IngestRequestSchema.parse(rawDTO)

            await this.ingestFileUseCase.execute(validatedDTO)

            return reply.status(201).send({
                message: 'Documento elaborato e indicizzato con successo',
                file: validatedDTO.fileName,
                department: validatedDTO.department
            })

        } catch (error: unknown) {
            request.log.error(error)

            // Gestione specifica per gli errori di validazione Zod
            if (error instanceof z.ZodError) {
                return reply.status(400).send({
                    error: 'VALIDATION_ERROR',
                    details: error.issues
                })
            }

            const message =
                error instanceof Error ? error.message : "Errore durante l'ingestione"
            
            return reply.status(500).send({ error: message })
        }
    }
}