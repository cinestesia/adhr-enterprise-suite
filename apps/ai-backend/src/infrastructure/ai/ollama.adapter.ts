/**
 * Adattatore dell'interfaccia IAIService per comunicare con Ollama.
 *
 * @temperature
 * Valori più bassi producono output più prevedibili (ad esempio, 0.1), mentre valori più alti generano
 * risultati più creativi o inaspettati (come 0.9). Compiti differenti richiederanno valori differenti
 * per questo parametro. Per esempio, la produzione di output strutturato di solito beneficia di
 * una temperatura più bassa, mentre compiti di scrittura creativa riescono meglio con un valore più alto.
 *
 * @embeddings
 *
 * Stiamo utilizzando al momento di default: paraphrase-multilingual-MiniLM-L12-v2
 *
 * curl http://localhost:8080/models/apply \
 *    -X POST \
 *    -H "Content-Type: application/json" \
 *    -d '{
 *      "id": "model-gallery@paraphrase-multilingual-MiniLM-L12-v2",
 *      "name": "adhr-text-embedding"
 *    }'
 */

import { IChatPort } from '@/domain/ports/chat.port'
import { ChatMessage } from '@/domain/models/chat-message.model'
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai'
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { IterableReadableStream } from '@langchain/core/utils/stream'
import { IEmbeddingsPort } from '@/domain/ports/embeddings.port'

export class OllamaAdapter implements IChatPort, IEmbeddingsPort {
    private model: ChatOpenAI
    private embeddings: OpenAIEmbeddings

    async predict(prompt: string): Promise<string> {
        try {
            const response = await this.model.invoke(prompt);

            // 1. Se il contenuto è già una stringa, lo restituiamo pulito
            if (typeof response.content === 'string') {
                return response.content;
            }

            // 2. Se è un array di blocchi (ContentBlock | Text), estraiamo solo le parti di testo
            if (Array.isArray(response.content)) {
                return response.content
                    .map((block) => {
                        if ("text" in block) return block.text; // Per i blocchi di testo standard
                        return ""; // Ignoriamo immagini o altri tipi di blocchi per il titolo
                    })
                    .join("");
            }

            return "Nuova Conversazione"; // Fallback se il tipo è inaspettato
        } catch (error) {
            console.error("Errore durante predict:", error);
            return "Nuova Conversazione";
        }
    }

    constructor() {
        this.model = new ChatOpenAI({
            openAIApiKey: process.env.OPENAI_API_KEY || 'ollama',

            configuration: {
                baseURL: process.env.AI_BASE_URL || 'http://localhost:11434/v1',
                timeout: 600000, // 10 minuti in millisecondi
            },

            model: process.env.AI_MODEL_NAME || 'llama3.1',

            temperature: 0, // Ollama è più affidabile con temperature basse, soprattutto per output tecnici e strutturati.

            // Ollama è veloce, ma Llama 3.1 8B su CPU può avere latenza iniziale
            // puoi aggiungere un timeout se necessario
        })

        this.embeddings = new OpenAIEmbeddings({
            openAIApiKey: process.env.OPENAI_API_KEY || 'ollama',

            configuration: {
                baseURL: process.env.AI_BASE_URL || 'http://localhost:11434/v1',
            },

            modelName: process.env.AI_EMBEDDING_MODEL_NAME || 'nomic-embed-text',
        })
    }


    /**
     * [
     * ChatMessage {
     *      role: 'system',
     *      content: " ... "   
     *      createdAt: 2026-05-13T13:32:31.344Z
     * },
     * 
     * ChatMessage {
     *      role: 'user',
     *      content: 'ciao come stai?',
     *      createdAt: 2026-05-13T13:24:39.396Z
     * },
     * ChatMessage {
     *      role: 'assistant',
     *      content: 'Ciao! Sono un assistente virtuale ufficiale di ADHR Group per il dipartimento Sistemi Informativi, quindi sono qui per aiutarti con le tue domande e risolvere eventuali problemi relativi a InRecruiting e CARM. Come posso aiutarti oggi?',
     *      createdAt: 2026-05-13T13:31:45.754Z
     * }
     * ]
     */


    async chat(
        message: string, // es. ciao come va?
        history: ChatMessage[] // es. [ { role: "assistant", content: "Ciao! Sono l'assitente AI Aziendale. Come posso aiutarti?" },{ role: "system", content: "Utilizza esclusivamente il seguente contesto aziendale per rispondere alla domanda dell'utente. Se la risposta non è presente, ammetti di non saperlo. CONTESTO: [estratto dei documenti]" }]
    ): Promise<IterableReadableStream<string>> {
        const langChainMessages = history.map((msg) => {
            if (msg.role === 'user') {
                return new HumanMessage(msg.content)
            }

            if (msg.role === 'assistant') {
                return new AIMessage(msg.content)
            }

            return new SystemMessage(msg.content)
        })

        langChainMessages.push(new HumanMessage(message))

        try {
            const parser = new StringOutputParser()

            /**
             * @note
             * this.model.pipe(parser) crea un oggetto Runnable.
             * LangChain non esegue nulla in questo preciso millisecondo.
             * Registra solo che c'è un "tubo" dove i dati entreranno nel modello
             * ed usciranno dal parser ( in questo caso sotto forma di stringa, grazie allo StringOutputParser).
             * Quando chiami .stream(langChainMessages):
             *
             * 1.   LangChain prende la lista dei tuoi messaggi e la valida.
             *
             * 2.   Traduce i messaggi nel formato esatto richiesto dall'API del fornitore
             *      (es. converte gli oggetti LangChain nel JSON che si aspetta OpenAI).
             *
             * 3.   Effettua una richiesta HTTP POST verso i server del fornitore dell'IA.
             *      Nella richiesta, inserisce il parametro stream: true.
             *
             * 4.   L'API del fornitore tiene aperta la connessione e inizia a inviare piccoli pezzi di testo
             *      (token) usando lo standard web Server-Sent Events (SSE).
             *
             * 5.   Passaggio nel Tubo e Parsing (Dentro parser): Qui entra in gioco il pipe().
             *      L'oggetto AIMessageChunk viene immediatamente passato al parser.
             *      Il parser estrae solo il testo puro (stringa) contenuto all'interno del chunk.
             *
             */

            const stream = await this.model.pipe(parser).stream(langChainMessages)
            return stream // I token di risposta vengono consumati in ChatController e inviati al client
        } catch (error) {
            console.error('Error occurred while invoking AI model:', error)
            throw new Error('Failed to get AI response')
        }
    }

    async embedDocuments(texts: string[]): Promise<number[][]> {
        return await this.embeddings.embedDocuments(texts)
    }

    async embedQuery(text: string): Promise<number[]> {
        return await this.embeddings.embedQuery(text)
    }
}
