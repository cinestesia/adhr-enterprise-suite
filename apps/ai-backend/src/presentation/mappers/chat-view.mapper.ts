import { ChatSession } from '@/modules/chat/domain/models/chat-session.model'
import { ChatSessionResponse } from '@/modules/chat/dtos/chat-sessions-response.dto'

export class ChatViewMapper {
    static toResponse(session: ChatSession): ChatSessionResponse {
        return {
            id: session.id,
            userId: session.userId,
            title: session.title, // <--- Qui invoca il GETTER pubblico 'title', risolvendo il bug di '_title'
            createdAt: session.createdAt.toISOString(),
        }
    }
}
