import { ICandidateRepositoryPort } from '@/modules/recruiting/domain/ports/candidate-repository.port'
import { ICvExtractorStreamingPort } from '@/modules/recruiting/domain/ports/cv-extractor.port'
import { IFileStoragePort } from '@/modules/shared/domain/ports/file-storage.port'
import { ILogger } from '@/modules/shared/domain/ports/logger.port'
import { Candidate, ExtractedCvData } from '@/modules/recruiting/domain/models/candidate.model'
import { LocalDocumentParserAdapter } from '@/modules/shared/infrastructure/parsers/local-document-parser.adapter'

export class ParseCvStreamingUseCase {
    constructor(
        private cvExtractor: ICvExtractorStreamingPort,
        private candidateRepo: ICandidateRepositoryPort,
        private fileStorage: IFileStoragePort,
        private docParser: LocalDocumentParserAdapter,
        private logger: ILogger
    ) {}

    async extractDataStream(
        fileBuffer: Buffer,
        fileName: string
    ): Promise<AsyncIterable<string>> {
        try {
            this.logger.info('Avvio estrazione testo da file CV', {
                action: 'CV_TEXT_EXTRACTION_START',
                component: 'ParseCvUseCase',
                fileName,
            })

            // 1. Estrazione del testo dal file (Sincrona/Bloccante ma veloce)
            const rawText = await this.docParser.parseToText(fileBuffer, fileName)

            if (!rawText || rawText.trim().length === 0) {
                throw new Error(
                    'Il file caricato sembra vuoto o non è stato possibile estrarre il testo.'
                )
            }

            this.logger.info('Testo estratto con successo. Richiesta stream all’LLM', {
                action: 'CV_LLM_STREAM_START',
                component: 'ParseCvUseCase',
                fileName,
            })

            /**
             * @note
             * Chiamata alla porta dell'infrastruttura che restituisce lo stream
             * si noti che il cv extractor è di solito eseguito da un LLM. Vedi nel
             * DI cosa iniettiamo.
             */
            const tokenStream = await this.cvExtractor.extractStream(rawText)

            return tokenStream
        } catch (error: any) {
            this.logger.error('Errore durante la Fase 1 di estrazione nel Use Case', {
                component: 'ParseCvUseCase',
                error: error.message,
            })
            throw error
        }
    }

    /**
     * @note
     * L'utente ha confermato/modificato i dati sulla Dashboard => salviamo.
     */
    async confirmAndSave(
        validatedData: ExtractedCvData,
        fileInfo: { buffer: Buffer; name: string }
    ): Promise<{ candidateId: string; fileUrl: string }> {
        try {
            console.log(
                '[ParseCvUseCase] Salvataggio del file originale tramite LocalStorageAdapter...'
            )
            const fileUrl = await this.fileStorage.upload(fileInfo.buffer, fileInfo.name)

            console.log('[ParseCvUseCase] Scrittura anagrafica Candidate nel DB...')
            const candidateEntity = new Candidate({
                personalData: validatedData.personalData,
                skills: validatedData.skills,
                experience: validatedData.experience,
                education: validatedData.education,
                languages: validatedData.languages,
                cvFileUrl: fileUrl,
            })

            const { id } = await this.candidateRepo.save(candidateEntity)

            return {
                candidateId: id!,
                fileUrl,
            }
        } catch (error: any) {
            console.error(
                '[ParseCvUseCase] Errore nel flusso di salvataggio definitivo:',
                error.message
            )
            throw error
        }
    }
}
