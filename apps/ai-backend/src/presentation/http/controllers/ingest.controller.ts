import { FastifyRequest, FastifyReply } from 'fastify'
import { IngestFileUseCase } from '@/application/use-cases/ingest-file.use-case'

export class IngestController {
    constructor(private ingestFileUseCase: IngestFileUseCase) {}

    async handleUpload(request: FastifyRequest, reply: FastifyReply) {
        // Estraiamo il file dallo stream multipart
        const data = await request.file()
        
        if (!data) {
            return reply.status(400).send({ error: 'Nessun file caricato' })
        }

        try {
            // Otteniamo il buffer del file (carichiamo il file in memoria)
            const buffer = await data.toBuffer()
            const fileName = data.filename

            await this.ingestFileUseCase.execute(buffer, fileName)

            return reply.status(201).send({
                message: 'Documento elaborato e indicizzato con successo',
                file: fileName
            })
            
        } catch (error: unknown) {
            request.log.error(error)
            const message = error instanceof Error ? error.message : 'Errore durante l\'ingestione'
            return reply.status(500).send({ error: message })
        }
    }
}