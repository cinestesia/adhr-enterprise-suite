import { IChatRepository } from '@/domain/ports/chat-repository.port'
import { IChatPort } from '@/domain/ports/chat.port'
import { IterableReadableStream } from '@langchain/core/utils/stream'
import { ChatRequestDTO } from '@/dtos/chat-request.dto'
import { ChatMessage } from '@/domain/models/chat-message.model' 
import { SessionService } from '../services/session.service'
import { RagService } from '../services/rag.service'
import { PromptBuilder } from '../services/prompt-builder.service'
import { ChatStreamService } from '../services/chat-stream.service'

interface ChatUseCaseOutput {
    stream: IterableReadableStream<string>
    sessionId: string
}

export class ChatUseCase {
    constructor(
        private sessionService: SessionService,
        private ragService: RagService,
        private streamService: ChatStreamService, 
        private promptBuilder: PromptBuilder,
        private chatRepo: IChatRepository,
        private aiGateway: IChatPort
    ) {}

    async execute(dto: ChatRequestDTO): Promise<ChatUseCaseOutput> {
        const { message, user, sessionId: providedId } = dto;

        try {
            const { session, isNew } = await this.sessionService.resolve(providedId, user.id, user.mainDepartment);
            const history = await this.chatRepo.getMessagesBySessionId(session.id, 10);

            if (isNew || history.length === 0) {
                this.sessionService.generateTitleInBackground(session.id, user.id, message);
            }
            await this.chatRepo.saveMessage(session.id, new ChatMessage('user', message));
            const context = await this.ragService.getContext(message, user.mainDepartment);
            console.log("HO CARICATO RAG:", context)
            const systemContent = this.promptBuilder.buildSystemMessage(user.mainDepartment, context);
            const augmentedHistory = [new ChatMessage('system', systemContent), ...history];
            const rawAiStream = await this.aiGateway.chat(message, augmentedHistory);
            
            return {
                stream: this.streamService.getWrappedStream(rawAiStream, session.id),
                sessionId: session.id
            };

        } catch (error) {
            console.error('[ChatUseCase] Error:', error);
            throw error;
        }
    }
}