/**
 * Adattatore dell'interfaccia IAIService per comunicare con LocalAI.
 *
 * @temperature
 * Valori più bassi producono output più prevedibili (ad esempio, 0.1), mentre valori più alti generano
 * risultati più creativi o inaspettati (come 0.9). Compiti differenti richiederanno valori differenti
 * per questo parametro. Per esempio, la produzione di output strutturato di solito beneficia di
 * una temperatura più bassa, mentre compiti di scrittura creativa riescono meglio con un valore più alto.
 */

import { IAIGateway } from '@/domain/ports/ai-gateway.interface'
import { ChatOpenAI } from '@langchain/openai'
import { Message } from '@/domain/models/chat'
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { IterableReadableStream } from '@langchain/core/utils/stream'

export class LocalAIAdapter implements IAIGateway {
    private model: ChatOpenAI

    constructor() {
        this.model = new ChatOpenAI({
            openAIApiKey: process.env.OPENAI_API_KEY || 'sk-no-key-required',

            configuration: {
                baseURL: process.env.AI_BASE_URL || 'http://localhost:8080/v1',
            },

            model: process.env.AI_MODEL_NAME || 'gpt-4',
            //
            temperature: 0.7,
        })
    }

    // es. { message: "Ciao", history: [{ role: 'system', content: 'Sei un assistente amichevole' }] }

    async chat(
        message: string,
        history: Message[]
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
}
