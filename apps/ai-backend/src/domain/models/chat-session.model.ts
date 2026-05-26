import { ChatMessage } from '@langchain/core/messages'

export class ChatSession {
    // Getter per proteggere l'integrità del titolo
    get title() {
        return this._title
    }

    get messages() {
        // Restituiamo una copia per evitare mutazioni esterne
        return [...this._messages]
    }

    // Una sessione può essere rinominata solo se il titolo è valido
    updateTitle(newTitle: string) {
        if (!newTitle || newTitle.trim().length < 3) {
            throw new Error('Il titolo della sessione deve avere almeno 3 caratteri')
        }
        this._title = newTitle.trim()
    }

    // Verifica se l'utente è il proprietario
    isOwnedBy(userId: string): boolean {
        return this.userId === userId
    }

    addMessage(message: ChatMessage) {
        this._messages.push(message)
    }

    constructor(
        public readonly id: string,
        public readonly userId: string,
        public readonly createdAt: Date,
        private _title: string,
        private _messages: ChatMessage[] = []
    ) {}
}
