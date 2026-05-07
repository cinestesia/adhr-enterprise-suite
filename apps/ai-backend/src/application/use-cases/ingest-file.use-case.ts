import { IFileStoragePort } from '@/domain/ports/file-storage.port'
import { IVectorDbPort } from '@/domain/ports/vector-db.port'
import { IngestRequestDTO } from '@/dtos/ingest-request.dto' // Importiamo il DTO
import { TextLoader } from '@langchain/classic/document_loaders/fs/text'
import { RecursiveCharacterTextSplitter } from '@langchain/classic/text_splitter'
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx'
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf'
import path from 'node:path'

export class IngestFileUseCase {
    constructor(
        private storage: IFileStoragePort,
        private vectorDb?: IVectorDbPort
    ) {}

    async execute(dto: IngestRequestDTO) {
        const { fileBuffer, fileName, department } = dto;
        const extension = path.extname(fileName).toLowerCase()
        const blob = new Blob([new Uint8Array(fileBuffer)])
        await this.storage.upload(fileBuffer, fileName)
        
        let loader = extension === '.pdf' ? new PDFLoader(blob) :
                     extension === '.docx' ? new DocxLoader(blob) :
                     new TextLoader(blob)

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
                    ingestedAt: new Date().toISOString(),
                },
            }
        })

        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        })

        const chunks = await splitter.splitDocuments(dataWithMetadata)

        console.log(`[Ingest] ${fileName}: generati ${chunks.length} chunk per il dipartimento ${department}`)

        try {
            if (!this.vectorDb) {
                throw new Error("Vector Database non disponibile")
            }
            
            await this.vectorDb.addDocument(chunks)
            console.log(`[Ingest] Successo: ${fileName} indicizzato correttamente.`)
        } catch (error) {
            console.error("Errore durante l'embedding:", error)
            throw new Error('Errore nel salvataggio dei vettori nel DB')
        }
    }
}