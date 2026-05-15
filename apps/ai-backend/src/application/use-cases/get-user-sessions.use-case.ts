import { IChatRepository } from '@/domain/ports/chat-repository.port'

export class GetUserSessionsUseCase {
    constructor(private chatRepository: IChatRepository) {}

    async execute(userId: string) {
        return await this.chatRepository.getSessionsByUserId(userId)
    }
}