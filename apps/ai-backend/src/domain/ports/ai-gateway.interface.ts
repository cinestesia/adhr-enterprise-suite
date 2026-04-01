import { Message } from '@/domain/models/chat'
import { IterableReadableStream } from '@langchain/core/utils/stream'

export interface IAIGateway {
    /**
     * Invia un messaggio all'AI e ottiene una risposta.
     * @param message Il messaggio dell'utente
     * @param history La cronologia dei messaggi precedenti
     *
     */

    chat(message: string, history: Message[]): Promise<IterableReadableStream<string>>
}
