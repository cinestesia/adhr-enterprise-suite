import { Message } from '@/domain/models/chat-to-be-deleted'
import { ChatMessage } from '../models/chat-message.model';

export interface IChatRepository {
    // Crea una nuova sessione e restituisce l'ID
    createSession(id: string, userId: string, title?: string): Promise<string>

    // Salva un singolo messaggio nel database
    saveMessage(sessionId: string, message: Message): Promise<void>
    
    getMessagesBySessionId(sessionId: string, limit?: number): Promise<ChatMessage[]>;
    
    // Recupera tutte le sessioni di un utente (per la sidebar del frontend)
    getSessionsByUserId(userId: string): Promise<any[]>

    checkSessionOwnership(sessionId: string, userId: string): Promise<boolean>

    updateSessionTitle(sessionId: string, title: string): Promise<void>
}
