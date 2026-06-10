export type MessageRole = 'user' | 'assistant' | 'system'

export class ChatMessage {
    constructor(
        public readonly role: MessageRole,
        public readonly content: string,
        public readonly createdAt: Date = new Date()
    ) {
        if (!content || content.trim().length === 0) {
            throw new Error('Il contenuto del messaggio è obbligatorio')
        }
    }

    get isFromUser(): boolean {
        return this.role === 'user'
    }
}
