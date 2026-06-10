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

    /**
     * Questa è un'invariante della nostra entità: il titolo deve essere sempre valido.
     * L'LLM genera il titolo in background. Cosa succede se l'LLM, per un qualsiasi motivo 
     * (un glitch, un prompt interpretato male, o un primo messaggio dell'utente composto da una sola parola/emoji), 
     * risponde con una stringa vuota o con meno di 3 caratteri?
     * 
     * 1. L'LLM restituisce "Ok" o "".
     * 2. SessionService in background chiama session.updateTitle("Ok").
     * 3. Lanciamo un errore perché il titolo non è valido.
     * 4. Il blocco try/catch del tuo servizio cattura l'errore e stampa un console.error.
     * 5. Risultato: La chat rimane per sempre con il titolo provvisorio "Nuova Conversazione [Department]", 
     *    senza che l'utente capisca il perché.
     * 
     * Nel DDD si distinguono le azioni intraprese dall'utente (che vanno bloccate con un errore se violano 
     * le regole) dalle azioni automatiche di sistema (che devono essere resilienti).
     * 
     * Quindi qui invece che lanciare un'eccezione potremmo semplicemente non aggiornare nulla 
     * e il titolo rimarrebbe quello provvisorio. In questo modo, anche se l'LLM dovesse rispondere 
     * con un titolo non valido, l'esperienza dell'utente non verrebbe compromessa da errori o titoli brutti, 
     * e la chat rimarrebbe comunque funzionante.
     * 
     */
    updateTitle(newTitle: string) {
        if (!newTitle || newTitle.trim().length < 3) {
            return;

            //throw new Error('Il titolo della sessione deve avere almeno 3 caratteri')
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
