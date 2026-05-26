import { ChatMessage } from '../models/chat-message.model'
import { ChatSession } from '../models/chat-session.model'

export interface IChatRepositoryPort {
    // session
    createSession(session: ChatSession): Promise<string>
    getSessionById(id: string): Promise<ChatSession | null>
    getSessionsByUserId(userId: string): Promise<ChatSession[]>
    checkSessionOwnership(sessionId: string, userId: string): Promise<boolean>
    updateSession(session: ChatSession): Promise<void>
    // messages
    getMessagesBySessionId(sessionId: string, limit?: number): Promise<ChatMessage[]>
    saveMessage(sessionId: string, message: ChatMessage): Promise<void>
}
