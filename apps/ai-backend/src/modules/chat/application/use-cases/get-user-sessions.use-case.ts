import { IChatRepositoryPort } from "../../domain/ports/chat-repository.port";

export class GetUserSessionsUseCase {
    constructor(private chatRepository: IChatRepositoryPort) {}

    async execute(userId: string) {
        return await this.chatRepository.getSessionsByUserId(userId)
    }
}
