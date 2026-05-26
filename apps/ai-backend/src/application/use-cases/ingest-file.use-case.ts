import { IFileStoragePort } from '@/domain/ports/file-storage.port'
import { IVectorDbPort } from '@/domain/ports/vector-db.port'
import { IngestRequestDTO } from '@/dtos/ingest-request.dto'
import { TextLoader } from '@langchain/classic/document_loaders/fs/text'
import { RecursiveCharacterTextSplitter } from '@langchain/classic/text_splitter'
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx'
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf'
import path from 'node:path'

export class IngestFileUseCase {
    // In futuro si potrebbe spostare questa logica in un Domain Service
    // ( es. DocumentParserService ) o in un adapter dedicato, per mantenere
    // il Use Case focalizzato solo sull'orchestrazione. Per ora, tenerlo lì va bene,
    // ma occhio alla crescita.

    async createDataWithMetadata(
        fileBuffer: Buffer,
        fileName: string,
        department: string
    ) {
        const extension = path.extname(fileName).toLowerCase()
        const blob = new Blob([new Uint8Array(fileBuffer)])

        let loader =
            extension === '.pdf'
                ? new PDFLoader(blob)
                : extension === '.docx'
                  ? new DocxLoader(blob)
                  : new TextLoader(blob)

        const rawData = await loader.load()

        // Inseriamo il DIPARTIMENTO
        // Questo permetterà al Vector DB di filtrare i chunk durante la chat
        const dataWithMetadata = rawData.map((doc) => {
            return {
                ...doc,
                metadata: {
                    ...doc.metadata,
                    source: fileName,
                    department: department, // <--- CHIAVE PER IL RAG MULTI-TENANT
                    // La data la gestiamo sul db sul record padre.
                    // ingestedAt: new Date().toISOString(),
                },
            }
        })

        return dataWithMetadata
    }

    constructor(
        private storage: IFileStoragePort,
        private vectorDb?: IVectorDbPort
    ) {}

    async execute(dto: IngestRequestDTO) {
        const { fileBuffer, fileName, department } = dto

        try {
            if (!this.vectorDb) {
                throw new Error('Vector Database non disponibile')
            }

            const splitter = new RecursiveCharacterTextSplitter({
                chunkSize: 1000,
                chunkOverlap: 200,
            })

            const dataWithMetadata = await this.createDataWithMetadata(
                fileBuffer,
                fileName,
                department
            )
            const chunks = await splitter.splitDocuments(dataWithMetadata)

            // Se l'upload fallisce, il database vettoriale rimane intatto con la vecchia versione del file.
            await this.storage.upload(fileBuffer, fileName)
            console.log(
                `[Ingest] ${fileName}: generati ${chunks.length} chunk per il dipartimento ${department}`
            )

            // Idempotenza: se il file è già stato indicizzato,
            // eliminiamo i chunk esistenti prima di aggiungere quelli nuovi
            await this.vectorDb.deleteBySource(fileName)
            await this.vectorDb.addDocument(chunks)
            console.log(`[Ingest] Successo: ${fileName} indicizzato correttamente.`)
        } catch (error) {
            console.error("Errore durante l'embedding:", error)
            throw new Error('Errore nel salvataggio dei vettori nel DB')
        }
    }
}
