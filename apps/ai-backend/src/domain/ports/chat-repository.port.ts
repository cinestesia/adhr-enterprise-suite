import { Message } from '@/domain/models/chat'

export interface IChatRepository {
    // Crea una nuova sessione e restituisce l'ID
    createSession(userId: string, title?: string): Promise<string>

    // Salva un singolo messaggio nel database
    saveMessage(sessionId: string, message: Message): Promise<void>

    // Recupera gli ultimi N messaggi di una sessione per darli all'AI
    getMessagesBySessionId(sessionId: string, limit?: number): Promise<Message[]>

    // Recupera tutte le sessioni di un utente (per la sidebar del frontend)
    getSessionsByUserId(userId: string): Promise<any[]>
}
