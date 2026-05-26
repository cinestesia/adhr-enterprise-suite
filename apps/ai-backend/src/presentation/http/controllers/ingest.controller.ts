import { FastifyRequest, FastifyReply } from 'fastify'
import { IngestFileUseCase } from '@/application/use-cases/ingest-file.use-case'
import { FileMapper } from '@/mappers/file.mapper' // Assicurati che il percorso sia corretto
import { IngestRequestSchema } from '@/dtos/ingest-request.dto'
import { z } from 'zod'

/**
 * @note
 *
 * I DTO ( Data Transfer Object ) sono oggetti che definiscono un contrattto per i dati in ingresso in
 * un caso d'uso. Per esempio in questo caso il caso d'uso si aspetta di ricevere:
 *
 * 1. fileBuffer - un buffer che rappresenta il contenuto del file da elaborare
 * 2. fileNmae - il nome del file, che ci serve per capire il formato e per eventuali log o messaggi di risposta
 * 3. department - il dipartimento a cui associare il documento, che ci serve per indicizzare correttamente il documento
 *
 * Il controller di Presentation, funziona un po come un raccordo tra il mondo esterno da cui arrivano i dati dati
 * come per esempio una richiesta HTTP multipart/form-data e il mondo interno dell'applicazione, che si aspetta
 * di ricevere un DTO già validato e strutturato.
 *
 * Il controller ha la rensposabilità di prendere i dati grezzi in ingresso, trasformarli in un DTO e validare
 * i dati secondo le regole definite nel DTO. In questo caso utilizziamo Zod per definire le regole di validazione
 *
 * In caso i dati in ingresso siano non validi, il controller si occupa di restituire un errore al client.
 * come 400 Bad Request oppure 500 Internal Server Error, con un messaggio che spiega cosa è andato storto.
 *
 * I generale i Mapper mappano da http grapql, da multipart/form-data, da token JWT ecc.. verso i DTO.
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
            const validatedDTO = IngestRequestSchema.parse(rawDTO)
            await this.ingestFileUseCase.execute(validatedDTO)

            return reply.status(201).send({
                message: 'Documento elaborato e indicizzato con successo',
                file: validatedDTO.fileName,
                department: validatedDTO.department,
            })
        } catch (error: unknown) {
            request.log.error(error)

            if (error instanceof z.ZodError) {
                return reply.status(400).send({
                    error: 'VALIDATION_ERROR',
                    details: error.issues,
                })
            }

            const message =
                error instanceof Error ? error.message : "Errore durante l'ingestione"

            return reply.status(500).send({ error: message })
        }
    }
}
