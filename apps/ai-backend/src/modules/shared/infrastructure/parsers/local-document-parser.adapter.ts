import { TextLoader } from '@langchain/classic/document_loaders/fs/text'
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx'
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf'
import path from 'node:path'

export class LocalDocumentParserAdapter {
    /**
     * Riceve un buffer di un file e il suo nome, estrae e restituisce tutto il testo unificato.
     */
    async parseToText(fileBuffer: Buffer, fileName: string): Promise<string> {
        const extension = path.extname(fileName).toLowerCase()
        const blob = new Blob([new Uint8Array(fileBuffer)])

        let loader =
            extension === '.pdf'
                ? new PDFLoader(blob)
                : extension === '.docx'
                  ? new DocxLoader(blob)
                  : new TextLoader(blob)

        const documents = await loader.load()

        // Uniamo il contenuto di tutte le pagine/sezioni in un'unica stringa di testo
        return documents.map((doc) => doc.pageContent).join('\n')
    }
}
