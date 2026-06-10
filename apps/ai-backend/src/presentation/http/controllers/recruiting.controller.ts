// presentation/http/controllers/recruiting.controller.ts
import { FastifyRequest, FastifyReply } from 'fastify'
import { FileMapper } from '@/presentation/mappers/file.mapper'
import { z } from 'zod'
import { ConfirmSaveCandidateSchema } from '@/modules/recruiting/dtos/recruiting.dto'
import { IngestRequestSchema } from '@/modules/shared/dtos/ingest-request.dto'
import { initSSE, sendSSE } from '@/presentation/http/helpers/sse.helpers'
import { ParseCvStreamingUseCase } from '@/modules/recruiting/application/use-cases/parse-cv-streaming.use-case'

export class RecruitingController {
    constructor(private parseCvUseCase: ParseCvStreamingUseCase) {}

    /**
     * @note
     * handler per caricare un cv ed estrarre i dati in streaming (SSE).
     * Mantiene le validazioni Zod ereditate dall'Ingestion del RAG.
     */
    async extract(request: FastifyRequest, reply: FastifyReply) {
        let isClosed = false
        const data = await request.file()
        if (!data) {
            return reply
                .status(400)
                .send({ error: 'Nessun file Curriculum Vitae caricato' })
        }

        try {
            /**
             * @note
             * Qui ci occupiamo di mappare una richiesta in un DTO
             * che rappresenta un file. Ci occupiamo anche della
             * validazione ZOD secondo come specificato dal DTO.
             *
             */
            const fileData = await FileMapper.toIngestDTO(data)
            const cvFileSchema = IngestRequestSchema.omit({ department: true })
            const validatedFileData = cvFileSchema.parse(fileData)

            /**
             * @note
             * Se la validazione passa, inizializziamo immediatamente lo stream SSE
             * Questo risponde subito con HTTP 200 al BFF ( Backed For Frontend ) di
             * Next.js e azzera il timer del timeout
             */
            initSSE(reply)

            // Gestione della disconnessione improvvisa del browser o del BFF
            reply.raw.on('close', () => {
                isClosed = true
                request.log.info(
                    `Client o BFF disconnesso durante l'estrazione del file: ${validatedFileData.fileName}`
                )
            })

            // Notifichiamo all'interfaccia che il file è valido e stiamo
            // facendo il parsing del file.
            await sendSSE(reply, { type: 'status', content: 'parsing_file' })

            /**
             * @note
             * Invochiamo il Caso d'Uso per avviare l'estrazione dei dati strutturati
             * dal file come stream, un token alla volta.
             * il caso d'uso ritorna uno stream che collega direttamente l'output
             * di ollama e il nostro controller.
             */
            const tokenStream = await this.parseCvUseCase.extractDataStream(
                validatedFileData.fileBuffer,
                validatedFileData.fileName
            )

            if (!isClosed) {
                await sendSSE(reply, { type: 'status', content: 'llm_inference' })
            }

            // Ciclo di streaming dei token generati da Ollama (Mantiene vivo il canale)
            for await (const chunk of tokenStream) {
                if (isClosed) break
                // Inviamo ogni pezzettino di testo (delta) conforme alla struttura della tua chat
                await sendSSE(reply, { type: 'token', content: chunk })
            }

            // 4. Inviamo il segnale di chiusura stream al frontend
            if (!isClosed) {
                await sendSSE(reply, { type: 'done' })
            }
        } catch (error: unknown) {
            request.log.error(error)

            // Se l'errore avviene PRIMA di initSSE, rispondiamo con un classico HTTP Status Code
            if (!reply.raw.headersSent) {
                if (error instanceof z.ZodError) {
                    return reply.status(400).send({
                        error: 'VALIDATION_ERROR',
                        details: error.issues,
                    })
                }
                const message =
                    error instanceof Error
                        ? error.message
                        : 'Errore durante il parsing del CV'
                return reply.status(500).send({ error: message })
            }

            // Se l'errore avviene DURANTE lo streaming (es. Ollama crasha a metà),
            // dobbiamo spararlo dentro il canale SSE come fai nella chat
            if (!isClosed) {
                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : 'Errore interno durante il parsing'
                await sendSSE(reply, {
                    type: 'error',
                    error: { code: 'EXTRACT_ERROR', message: errorMessage },
                })
            }
        } finally {
            // Chiudiamo il canale di scrittura HTTP in sicurezza
            if (reply.raw.writable) {
                reply.raw.end()
            }
        }
    }

    /**
     * FASE 2: L'operatore ha modificato/confermato i dati e clicca "Salva"
     * POST /api/v1/recruiting/confirm
     */
    async confirm(request: FastifyRequest, reply: FastifyReply) {
        try {
            const validatedDTO = ConfirmSaveCandidateSchema.parse(request.body)
            const dummyFileBuffer = Buffer.from('Contenuto CV simulato')

            const result = await this.parseCvUseCase.confirmAndSave(validatedDTO, {
                buffer: dummyFileBuffer,
                name: validatedDTO.temporaryFileName,
            })

            return reply.status(201).send({
                message: 'Candidato validato e salvato con successo nel sistema',
                candidateId: result.candidateId,
                fileUrl: result.fileUrl,
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
                error instanceof Error
                    ? error.message
                    : 'Errore nel salvataggio del candidato'
            return reply.status(500).send({ error: message })
        }
    }
}
