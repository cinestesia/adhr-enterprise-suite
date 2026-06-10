import { randomUUID } from 'crypto'
import { IChatRepositoryPort } from '../../domain/ports/chat-repository.port';
import { ChatSession } from '../../domain/models/chat-session.model';
import { IAiGatewayPort } from '../../domain/ports/ai-gateway.port';

export class SessionService {
    constructor(
        private chatRepo: IChatRepositoryPort,
        private aiGateway: IAiGatewayPort // Serve per la generazione del titolo
    ) {}

    /**
     * @note
     *
     * CASO A: Nuova sessione.
     * Per esempio, l'utente apre la pagina della chat. Il client non ha un sessionId.
     * Invia la prima richiesta senza sessionId, il backend ne crea uno nuovo e lo restituisce.
     * Inizialmente creiamo con un titolo provvisiorio e poi lo aggiorniamo dopo.
     *
     * CASO B: Sessione esistente.
     * Il client invia sessionId, il backend verifica che esista e che appartenga all'utente.
     * Se è valido, restituisce la sessione con i messaggi.
     * Se non è valido, restituisce un errore di accesso negato.
     *
     * Nel DDD, un Application Service non dovrebbe modificare un'entità "creandone una nuova da zero" 
     * nel database se può evitarlo, ma dovrebbe mutare lo stato di quella esistente.
     */

    async resolve(
        sessionId: string | undefined,
        userId: string,
        department: string
    ): Promise<{ session: ChatSession; isNew: boolean }> {
        if (!sessionId) {
            const newId = randomUUID()
            const session = new ChatSession(
                newId,
                userId,
                new Date(),
                `Nuova Conversazione ${department}`
            )
            await this.chatRepo.createSession(session)
            return { session, isNew: true }
        }

        const session = await this.chatRepo.getSessionById(sessionId)

        if (!session) {
            throw new Error('Sessione non trovata')
        }
        
        if (!session.isOwnedBy(userId)) {
            throw new Error('Accesso negato: non sei il proprietario di questa chat')
        }

        return { session: session, isNew: false }
    }

    /**
     * Genera e aggiorna il titolo in background.
     * @note Non viene atteso dal flusso principale (Fire and Forget)
     */
    async generateTitleInBackground(
        session: ChatSession,
        userId: string,
        firstMessage: string
    ): Promise<void> {
        try {
            const prompt = `Genera un titolo sintetico (max 5 parole) per questa chat: "${firstMessage}". Rispondi SOLO col titolo.`
            const title = await this.aiGateway.predict(prompt)
            session.updateTitle(title)
            await this.chatRepo.updateSessionTitle(session.id, session.title)
        } catch (error) {
            console.error('[SessionService] Failed to generate background title:', error)
        }
    }
}
