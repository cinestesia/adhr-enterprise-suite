import { IChatRepository } from '@/domain/ports/chat-repository.port'
import { Message } from '@/domain/models/chat'
import { DbInstance } from './index'
import { chatSessions, chatMessages } from './schema'
import { eq, desc } from 'drizzle-orm'

export class PgChatAdapter implements IChatRepository {
    constructor(private db: DbInstance) {}

    async createSession(userId: string, title?: string): Promise<string> {
        const [session] = await this.db
            .insert(chatSessions)
            .values({ userId, title })
            .returning({ id: chatSessions.id })
        return session.id
    }

    async saveMessage(sessionId: string, message: Message): Promise<void> {
        await this.db.insert(chatMessages).values({
            sessionId,
            role: message.role,
            content: message.content,
        })
    }

    async getMessagesBySessionId(
        sessionId: string,
        limit: number = 20
    ): Promise<Message[]> {
        const rows = await this.db
            .select()
            .from(chatMessages)
            .where(eq(chatMessages.sessionId, sessionId))
            .orderBy(desc(chatMessages.createdAt))
            .limit(limit)

        // LangChain vuole i messaggi in ordine cronologico (dal più vecchio al più nuovo)
        return rows.reverse().map((row) => ({
            role: row.role as 'user' | 'assistant' | 'system',
            content: row.content,
        }))
    }

    async getSessionsByUserId(userId: string): Promise<any[]> {
        return await this.db
            .select()
            .from(chatSessions)
            .where(eq(chatSessions.userId, userId))
            .orderBy(desc(chatSessions.createdAt))
    }
}
