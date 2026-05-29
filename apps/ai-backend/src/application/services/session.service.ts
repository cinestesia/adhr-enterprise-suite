// apps/ai-backend/src/application/services/session.service.ts

import { IChatRepositoryPort } from '@/domain/ports/chat-repository.port'
import { IChatPort } from '@/domain/ports/chat.port'
import { ChatSession } from '@/domain/models/chat-session.model'
import { randomUUID } from 'crypto'

export class SessionService {
    constructor(
        private chatRepo: IChatRepositoryPort,
        private aiGateway: IChatPort // Serve per la generazione del titolo
    ) {}

    /**
     * @note
     *
     * CASO A: Nuova sessione.
     * Per esempio, l 'utente apre la pagina della chat. Il client non ha un sessionId.
     * Invia la prima richiesta senza sessionId, il backend ne crea uno nuovo e lo restituisce.
     * Inizialmente creiamo con un titolo provvisiorio e poi lo aggiorniamo dopo.
     *
     * CASO B: Sessione esistente.
     * Il client invia sessionId, il backend verifica che esista e che appartenga all'utente.
     * Se è valido, restituisce la sessione con i messaggi.
     * Se non è valido, restituisce un errore di accesso negato.
     *
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

        const isOwner = await this.chatRepo.checkSessionOwnership(sessionId, userId)
        if (!isOwner) {
            throw new Error(
                "Accesso negato: sessione non valida o non appartenente all'utente"
            )
        }

        const session = await this.chatRepo.getSessionById(sessionId)

        if (!session) {
            throw new Error('Sessione non trovata')
        }

        if (session.userId !== userId) {
            throw new Error('Accesso negato: non sei il proprietario di questa chat')
        }

        return { session: session, isNew: false }
    }

    /**
     * Genera e aggiorna il titolo in background.
     * @note Non viene atteso dal flusso principale (Fire and Forget)
     */
    async generateTitleInBackground(
        sessionId: string,
        userId: string,
        firstMessage: string
    ): Promise<void> {
        try {
            const prompt = `Genera un titolo sintetico (max 5 parole) per questa chat: "${firstMessage}". Rispondi SOLO col titolo.`
            const title = await this.aiGateway.predict(prompt)
            const updatedSession = new ChatSession(
                sessionId,
                userId,
                new Date(),
                title.trim().replace(/["']/g, '')
            )

            await this.chatRepo.updateSession(updatedSession)
        } catch (error) {
            console.error('[SessionService] Failed to generate background title:', error)
        }
    }
}
