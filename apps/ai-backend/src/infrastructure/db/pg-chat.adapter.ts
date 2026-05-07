import { IChatRepository } from '@/domain/ports/chat-repository.port'
import { Message } from '@/domain/models/chat-to-be-deleted'
import { DbInstance } from './index'
import { chatSessions, chatMessages } from './schema'
import { eq, desc, and } from 'drizzle-orm'
import { ChatMessage, MessageRole } from '@/domain/models/chat-message.model'

/**
 * @note
 * Adapter per la gestione della chat su PostgreSQL usando Drizzle-ORM.
 * In un caso d'uso parliamo sempre con il linguaggio del dominio di business.
 * Al repository dunque vengono passati: 
 * oggetti semplici (stringhe, numeri, UUID) per le ricerche: sessionId, userId, 
 * entità o value object per i dati più complessi: Message, ChatSession, etc.
 * 
 * Il repository deve ritornare sempre entità del dominio 
 * In questo modo se il Use Case riceve un'Entità, può invocare su di essa della 
 * logica di business. Se riceve un oggetto anonimo, è solo un contenitore di dati "morto".
 */
export class PgChatAdapter implements IChatRepository {
    
    constructor(private db: DbInstance) {}

    async createSession(id: string, userId: string, title?: string): Promise<string> {
        const [session] = await this.db
            .insert(chatSessions)
            .values({ 
                id, // Usiamo l'UUID generato dall'Application layer
                userId, 
                title: title || 'Nuova Conversazione' 
            })
            .returning({ id: chatSessions.id })
        return session.id
    }

    async checkSessionOwnership(sessionId: string, userId: string): Promise<boolean> {
        const [session] = await this.db
            .select({ id: chatSessions.id })
            .from(chatSessions)
            .where(
                and(
                    eq(chatSessions.id, sessionId),
                    eq(chatSessions.userId, userId)
                )
            )
            .limit(1)
        
        return !!session // Ritorna true se esiste, false altrimenti
    }

    // Aggiungiamo un metodo per aggiornare il titolo in un secondo momento
    async updateSessionTitle(sessionId: string, title: string): Promise<void> {
        await this.db
            .update(chatSessions)
            .set({ title })
            .where(eq(chatSessions.id, sessionId))
    }

    async saveMessage(sessionId: string, message: Message): Promise<void> {
        await this.db.insert(chatMessages).values({
            sessionId,
            role: message.role,
            content: message.content,
        })
    }

    async getMessagesBySessionId(sessionId: string, limit: number = 20): Promise<ChatMessage[]> {
        const rows = await this.db
            .select()
            .from(chatMessages)
            .where(eq(chatMessages.sessionId, sessionId))
            .orderBy(desc(chatMessages.createdAt))
            .limit(limit);

        // Mappiamo i dati grezzi del DB nell'Entità di Dominio
        return rows.reverse().map(row => new ChatMessage(
            row.role as MessageRole,
            row.content,
            row.createdAt
        ));
    }

    async getSessionsByUserId(userId: string): Promise<any[]> {
        return await this.db
            .select()
            .from(chatSessions)
            .where(eq(chatSessions.userId, userId))
            .orderBy(desc(chatSessions.createdAt))
    }
}
