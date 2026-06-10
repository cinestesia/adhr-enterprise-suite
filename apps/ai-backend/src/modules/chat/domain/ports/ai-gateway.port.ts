import { IterableReadableStream } from '@langchain/core/utils/stream'
import { ChatMessage } from '../models/chat-message.model'

export interface IAiGatewayPort {
    /**
     * Invia un messaggio all'AI e ottiene una risposta.
     * @param message Il messaggio dell'utente
     * @param history La cronologia dei messaggi precedenti
     *
     */

    chat(message: string, history: ChatMessage[]): Promise<IterableReadableStream<string>>

    // risposte "secche" (es. per il titolo)
    predict(prompt: string): Promise<string>
}
