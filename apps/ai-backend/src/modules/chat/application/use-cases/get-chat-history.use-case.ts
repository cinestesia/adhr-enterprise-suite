import { IChatRepositoryPort } from "../../domain/ports/chat-repository.port"
import { ChatMessage } from "../../domain/models/chat-message.model"

export class GetChatHistoryUseCase {
    constructor(private chatRepository: IChatRepositoryPort) {}

    async execute(sessionId: string, userId: string): Promise<ChatMessage[]> {
        // 1. Recuperiamo l'intera sessione dal DB
        const session = await this.chatRepository.getSessionById(sessionId)

        if (!session) {
            throw new Error('Unauthorized: Session not found or access denied')
        }

        if (!session.isOwnedBy(userId)) {
            throw new Error('Accesso negato: non sei il proprietario di questa chat')
        }

        return await this.chatRepository.getMessagesBySessionId(sessionId, 50)
    }
}