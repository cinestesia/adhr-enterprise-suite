import { FastifyRequest, FastifyReply } from 'fastify'
import { IngestFileUseCase } from '@/application/use-cases/ingest-file.use-case'
import { FileMapper } from '@/mappers/file.mapper' // Assicurati che il percorso sia corretto
import { IngestRequestSchema } from '@/dtos/ingest-request.dto'
import { z } from 'zod'

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