import { IChatRepository } from '@/domain/ports/chat-repository.port'
import { DbInstance } from './index'
import { chatSessions, chatMessages } from './schema'
import { eq, desc, and } from 'drizzle-orm'
import { ChatMessage, MessageRole } from '@/domain/models/chat-message.model'
import { ChatSession } from '@/domain/models/chat-session.model'

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

    /**
     * @note Riceve l'entità ChatSession completa. 
     * Questo garantisce che la sessione nasca già con userId e regole di business valide.
     */
    async createSession(session: ChatSession): Promise<string> {
        const [inserted] = await this.db
            .insert(chatSessions)
            .values({ 
                id: session.id, 
                userId: session.userId, 
                title: session.title,
                createdAt: session.createdAt
            })
            .returning({ id: chatSessions.id })
        
        return inserted.id
    }

    async getSessionById(id: string): Promise<ChatSession | null> {
        const [row] = await this.db
            .select()
            .from(chatSessions)
            .where(eq(chatSessions.id, id))
            .limit(1);

        if (!row) return null;

        return new ChatSession(
            row.id,
            row.userId,
            row.createdAt, // Terzo parametro: Date
            row.title ?? 'Nuova Conversazione' // Quarto parametro: string
        );
    }

    async getSessionsByUserId(userId: string): Promise<ChatSession[]> {
        const rows = await this.db
            .select()
            .from(chatSessions)
            .where(eq(chatSessions.userId, userId))
            .orderBy(desc(chatSessions.createdAt))

        return rows.map(row => new ChatSession(
            row.id,
            row.userId,
            row.createdAt,
            row.title ?? 'Nuova Conversazione',
        ))
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

    async updateSession(session: ChatSession): Promise<void> {
        await this.db
            .update(chatSessions)
            .set({ 
                title: session.title,
                // Qui potrai aggiungere altri campi man mano che l'entità ChatSession cresce
                // es: status: session.status,
                // es: metadata: session.metadata
            })
            .where(eq(chatSessions.id, session.id));
    }

    // Aggiungiamo un metodo per aggiornare il titolo in un secondo momento
    // async updateSessionTitle(sessionId: string, title: string): Promise<void> {
    //     await this.db
    //         .update(chatSessions)
    //         .set({ title })
    //         .where(eq(chatSessions.id, sessionId))
    // }

    async saveMessage(sessionId: string, message: ChatMessage): Promise<void> {
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


}
