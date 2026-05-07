// src/domain/models/chat-message.model.ts

export type MessageRole = 'user' | 'assistant' | 'system';

export class ChatMessage {
    constructor(
        public readonly role: MessageRole,
        public readonly content: string,
        public readonly createdAt: Date = new Date()
    ) {
        // Logica di business: un messaggio non può essere vuoto
        if (!content || content.trim().length === 0) {
            throw new Error("Il contenuto del messaggio è obbligatorio");
        }
    }

    // Esempio di logica: il messaggio è di un umano?
    get isFromUser(): boolean {
        return this.role === 'user';
    }
}