import { useQuery } from '@tanstack/react-query'
import { chatService } from '../services/chat.service'

export function useChatHistory(sessionId?: string) {
    return useQuery({
        queryKey: ['chat-history', sessionId],
        queryFn: () => chatService.getHistory(sessionId!),
        enabled: !!sessionId && sessionId !== 'new', // Non scaricare se la chat è nuova
        staleTime: 1000 * 60 * 5, // Cache di 5 minuti
    })
}

export function useChatSessions() {
    return useQuery({
        queryKey: ['chat-sessions'],
        queryFn: () => chatService.getSessions(),
    })
}