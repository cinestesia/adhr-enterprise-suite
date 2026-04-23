import { IEmbeddingsPort } from '@/domain/ports/embeddings.port'
import { IFileStoragePort } from '@/domain/ports/file-storage.port'
import { IVectorDbPort } from '@/domain/ports/vector-db.port'
import { TextLoader } from '@langchain/classic/document_loaders/fs/text'
import { RecursiveCharacterTextSplitter } from '@langchain/classic/text_splitter'
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx'
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf'

import path from 'node:path'

export class IngestFileUseCase {

    constructor(
        private storage: IFileStoragePort,
        private embeddings: IEmbeddingsPort,
        private vectorDb?: IVectorDbPort
    ) {}

    async execute( fileBuffer: Buffer, fileName: string) {
        
        // 1. Qui salvo il file fisicamente per audit o ri-elaborazione
        const filePath = await this.storage.upload(fileBuffer, fileName)

        // 2. Seleziono il loader corretto in base all'estensione del file
        let loader 
        const extension = path.extname(fileName)
        const blob = new Blob([new Uint8Array(fileBuffer)]);
        switch (extension) { 
            case '.pdf': 
                loader = new PDFLoader(blob)
                break
            case '.docx': 
                loader = new DocxLoader(blob)
                break
            default:
                loader = new TextLoader(blob)
        }
        /**
         * @note
         * rawData è di tipo Document => metadata management 
         * Che tu carichi un PDF, un Word o un Markdown, l'output è sempre 
         * lo stesso oggetto. Questo ti permette di scrivere una pipeline 
         * di embedding che non deve sapere da dove arriva il file.
         * 
         * I loader intelligenti estraggono metadati (numero di pagina, autore, 
         * data di creazione). Se domani vorrai chiedere all'AI: 
         * "Cosa dice il documento FAQ a pagina 4?", con LangChain hai 
         * già il campo metadata: { page: 4 }. Se scrivi il tuo parser, 
         * devi mappare tutto a mano.
         * 
         * I loader di LangChain (specialmente quelli community) provano a preservare 
         * la semantica del layout:
         * Riconoscono dove finisce un paragrafo e inizia un altro.
         * Mantengono le tabelle in un formato che l'AI può ancora "intuire" 
         * (spesso trasformandole in testo incolonnato o Markdown).
         * Gestiscono i caratteri speciali e le codifiche (UTF-8 vs Latin-1) 
         * che nei .docx o nei .pdf sono spesso incasinate.
         * 
         */
        const rawData = await loader.load();


        // --- AGGIUNTA METADATI ---
        // Mappiamo i documenti estratti per sovrascrivere o aggiungere metadati
        const data= rawData.map(doc => {
            return {
                ...doc,
                metadata: {
                    ...doc.metadata,
                    source: fileName, // Usiamo il vero nome del file (es. "policy_aziendale.pdf")
                    ingestedAt: new Date().toISOString(), // Magari aggiungiamo anche un timestamp
                }
            };
        });

        /**
         * @note
         *  Invece di inviare tutto il file estratto ad un LLM si ricorre
         *  al CHUNKING. CIoè dividiamo il testo in pezzi gestibili dall'LLM. 
         *  Se non facessimo così e gli mandassimo un documento di 500 pagine 
         *  ad ogni interazione il sistema LLM ricorderebbe al massimo le prime
         *  10 pagine. Inoltre sarebbe molto costoso, perchè nelle interazione 
         *  con gli LLM come gemini ecc.. paghi per token inviati. Latenza: 
         *  più testo mandi più è lento. Precisione ("Lost in the Middle"): 
         *  Gli LLM tendono a essere molto precisi all'inizio e alla fine del contesto, 
         *  ma diventano meno accurati nel mezzo se il testo è troppo lungo. 
         * 
         *  Invece di un unico Document, lo si divide in piccoli pezzi autonomi 
         *  tramite uno Splitter: RecursiveCharacterTextSplitter di LangChain.
         * 
         *  Micro-contesti: Se l'utente chiede "Come cambio l'email?", il 
         *  sistema cerca nel database vettoriale solo il pezzetto (chunk) 
         *  che parla dell'email.
         * 
         *  Iniezione: Invii all'LLM solo quel micro-contesto:
         *  "Contesto: [Pezzetto sull'email]. Domanda: Come cambio l'email?"
         * 
         *  chunkOverlap: 200. Questo è fondamentale. Immagina che il testo parli 
         *  di una procedura di sicurezza. Se il chunk 1 finisce proprio mentre 
         *  spiega il passaggio critico, il chunk 2 inizierà riprendendo 
         *  gli ultimi 200 caratteri del chunk 1.
         *  Perché si fa? Per evitare che il significato venga "spezzato" in due. 
         *  In questo modo, ogni chunk ha abbastanza contesto per essere capito 
         *  dall'AI quando verrà recuperato durante la chat.
         */

        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize:1000, // 1000 caratteri
            chunkOverlap: 200 // Sovrapposizione per non perdere contesto tra i pezzi
        })


        const chunks = await splitter.splitDocuments(data)
        // Vediamo cosa è successo:
        console.log(`Numero di chunk creati: ${chunks.length}`);
        console.log("Esempio del primo chunk:", JSON.stringify(chunks[0], null, 2));

        /**
         * @note
         * Un modello di embedding prende un chunk di testo e lo trasforma in un 
         * vettore di numeri reali. La dimensione del vettore (es. 768, 1536, 3072) 
         * è fissata dall'architettura del modello di embedding nel momento in cui 
         * viene addestrato.
         * 
         * È una scelta del progettista: Gli ingegneri decidono che n dimensioni 
         * siano sufficienti per "mappare" il significato semantico di una lingua.
         * 
         * Non cambia mai: Se usi il modello all-minilm-l6-v2 (molto comune su LocalAI), 
         * esso produrrà sempre vettori da 384 numeri, indipendentemente da quanto 
         * è lungo il testo o da quanto è potente il tuo PC.
         * 
         * 
         */


        try {
            const vectors = await this.embeddings.embedDocuments(chunks.map(chunk => chunk.pageContent));
            console.log('xxxxxxxxxxxxxxxxxxxxxxxxxx', vectors);
        } catch (error) {
            console.error("Errore durante l'embedding:", error);
        }


    }
}
