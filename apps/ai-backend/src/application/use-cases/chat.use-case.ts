import { IChatPort } from '@/domain/ports/chat.port'
import { IterableReadableStream } from '@langchain/core/utils/stream'

/**
 * @note
 * Quando dovremo implementare la RAG (Retrieval-Augmented Generation), sarà questo file a prendere
 * la domanda dell'utente, andare a cercare i CV nel database vettoriale e unire i CV alla domanda
 * prima di mandarla all'AI.
 *
 * Se vorremo salvare la cronologia dei messaggi nel database, lo faremo qui dentro.
 * 
 *
 */

export class ChatUseCase {
    constructor(private aiGateway: IChatPort) {}

    async execute(
        message: string,
        history: any[] = []
    ): Promise<IterableReadableStream<string>> {
        if (!message || message.trim() === '') {
            throw new Error('Il messaggio non può essere vuoto')
        }

        try {
            const response = await this.aiGateway.chat(message, history)
            return response
        } catch (error) {
            console.error('Error in ChatUseCase:', error)
            throw new Error("Errore durante l'elaborazione della chat")
        }
    }
}
