// features/chat/services/chat.api.ts
import { Message } from '../hooks/use-chat-old'

export const chatService = {
    // Recupera lo storico
    getHistory: async (sessionId: string): Promise<Message[]> => {
        const res = await fetch(`/api/chat/history/${sessionId}`)
        if (!res.ok) throw new Error('Errore nel recupero messaggi')
        return res.json()
    },

    // Recupera le sessioni per la sidebar
    getSessions: async () => {
        const res = await fetch('/api/chat/sessions')
        if (!res.ok) throw new Error('Errore nel recupero sessioni')
        return res.json()
    },
}
