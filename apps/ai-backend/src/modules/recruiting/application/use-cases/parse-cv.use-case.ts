import { IFileStoragePort } from '@/modules/shared/domain/ports/file-storage.port'
import { ICvExtractorPort } from '@/modules/recruiting/domain/ports/cv-extractor.port'
import { ExtractedCvData, Candidate } from '@/modules/recruiting/domain/models/candidate.model'
import { ICandidateRepositoryPort } from '@/modules/recruiting/domain/ports/candidate-repository.port'
import { ILogger } from '@/modules/shared/domain/ports/logger.port'
import { LocalDocumentParserAdapter } from '@/modules/shared/infrastructure/parsers/local-document-parser.adapter'

export class ParseCvUseCase {
    constructor(
        private cvExtractor: ICvExtractorPort,
        private candidateRepo: ICandidateRepositoryPort,
        private fileStorage: IFileStoragePort,
        private docParser: LocalDocumentParserAdapter,
        private logger: ILogger
    ) {}

    /**
     * @note
     * Riceve il file caricato dall'utente come un buffer di dati, estrae il testo
     * e invoca l'LLM per restituire lo schema JSON pronto per la validazione della
     * dashboard.
     */
    async extractData(fileBuffer: Buffer, fileName: string): Promise<ExtractedCvData> {
        try {
            /**
             * @note
             * Per quanto riguarda i log utilizzare console.log() in produzione
             * potrebbe essere un richio. Quando l'applicazione scala o si sposta
             * in un cluster cloud, I console.log standard sono bloccanti (sincroni)
             * e non hanno una struttura semantica,rendendo quasi impossibile
             * fare log aggregation (analizzare i log con strumenti come Kibana,
             * Grafana Loki o Azure Monitor). Per questo motivo ho creato il port
             * ILogger e l'adattatore e passiamo "Pino" da fastify.
             *
             * RIMOSSO: console.log(`[ParseCvUseCase] Estrazione testo dal file: ${fileName}...`)
             *
             */

            this.logger.info('Avvio estrazione testo da file CV', {
                action: 'CV_TEXT_EXTRACTION_START',
                component: 'ParseCvUseCase',
                fileName,
            })

            /**
             *
             */
            const rawText = await this.docParser.parseToText(fileBuffer, fileName)

            if (!rawText || rawText.trim().length === 0) {
                throw new Error(
                    'Il file caricato sembra vuoto o non è stato possibile estrarre il testo.'
                )
            }
            /**
             * @note
             * Nel DDD, il Core Domain contiene solo logica pura, calcoli,
             * invarianti di business e decisioni. Qualsiasi operazione
             * che richiede una comunicazione con l'esterno
             * (chiamate HTTP, letture di file, query al database)
             * non appartiene al dominio. Il Dominio esprime un bisogno:
             * "Ho bisogno di trasformare questo testo in dati strutturati di un Candidato".
             * Questo bisogno si traduce in una Porta (ICvExtractorPort).
             * L'Infrastruttura fornisce la tecnologia: Parlare con un server
             * Ollama locale via HTTP, attendere lo stream di byte, fare
             * il parsing di una stringa JSON ricevuta via rete...
             * sono tutte operazioni di I/O. Oggi la tecnologia è Ollama,
             * domani potrebbe essere un'API di OpenAI, dopodomani un
             * modello custom in Python. Il dominio non deve sapere nulla
             * di tutto ciò.
             */
            const extractedJson = await this.cvExtractor.extract(rawText)

            this.logger.info('Avvio estrazione testo da file CV', {
                action: 'CV_TEXT_EXTRACTION_START',
                component: 'ParseCvUseCase',
                fileName,
            })

            return extractedJson
        } catch (error: any) {
            console.error(
                '[ParseCvUseCase] Errore durante la Fase 1 di estrazione:',
                error.message
            )
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
