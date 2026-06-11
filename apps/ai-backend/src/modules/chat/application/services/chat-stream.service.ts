import { IterableReadableStream } from '@langchain/core/utils/stream'
import { ChatMessage } from '../../domain/models/chat-message.model'
import { IChatRepositoryPort } from '../../domain/ports/chat-repository.port'

export class ChatStreamService {
    constructor(private chatRepo: IChatRepositoryPort) {}

    /**
     * Intercetta i chunk dello stream AI, li accumula e salva il messaggio finale.
     * ok. 
     */ 
    getWrappedStream(rawStream: any, sessionId: string): IterableReadableStream<string> {
        const repo = this.chatRepo

        async function* generator() {
            let fullContent = ''

            for await (const chunk of rawStream) {
                fullContent += chunk
                yield chunk
            }

            // Quando lo stream finisce, salviamo il messaggio dell'assistente
            if (fullContent.trim().length > 0) {
                const assistantMsg = new ChatMessage('assistant', fullContent)
                await repo.saveMessage(sessionId, assistantMsg)
            }
        }

        return IterableReadableStream.fromAsyncGenerator(generator())
    }
}
