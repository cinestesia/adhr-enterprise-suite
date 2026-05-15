import { IChatRepository } from '@/domain/ports/chat-repository.port'

export class GetChatHistoryUseCase {
    constructor(private chatRepository: IChatRepository) {}

    async execute(sessionId: string, userId: string) {
        // 1. Sicurezza: controlliamo che la sessione appartenga all'utente
        const isOwner = await this.chatRepository.checkSessionOwnership(sessionId, userId)
        if (!isOwner) throw new Error('Unauthorized: Session not found or access denied')

        // 2. Recuperiamo i messaggi
        return await this.chatRepository.getMessagesBySessionId(sessionId, 50)
    }
}