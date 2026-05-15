import { useState, useCallback, useRef } from 'react'

export interface Message {
    role: 'user' | 'assistant'
    content: string
}

/**
 * @note
 * la variabile accessToken nell'hook potrebbe servire per mostrare/nascondere il tasto "Invia". 
 * Adesso non la sto in effetti utilizzando, ma può essere importante che venga passata da chi usa l'hook 
 * (es. il componente ChatInput) 
 * 
 */
export function useChat(accessToken?: string, ) { 
    const [error, setError] = useState<string | null>(null)
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: "Ciao! Sono l'assistente AI di ADHR Group..." },
    ])
    const [isLoading, setIsLoading] = useState(false)
    const [isTyping, setIsTyping] = useState(false)
    
    // Usiamo un ref per persistere il sessionId tra i vari sendMessage senza triggerare re-render
    const sessionIdRef = useRef<string | null>(null)

    const sendMessage = useCallback(
        async (content: string) => {
            // if (!content.trim() || !accessToken) return // Non partiamo senza token

            const usrMsg: Message = { role: 'user', content }
            setMessages((prev) => [...prev, usrMsg])
            setIsLoading(true)

            try {
                setError(null)
                
                /**
                 *  @note
                 * 
                 *  {
                 *      "message": "Ciao, come posso candidarmi per una posizione?",
                 *      "sessionId": "abc-123-def-456"
                 *  }
                 * 
                 * 
                 */
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        // MESSO IN api/chat ==> 'Authorization': `Bearer ${accessToken}` 
                    },
                    body: JSON.stringify({ 
                        message: content,                        
                        sessionId: sessionIdRef.current || undefined 
                    }),
                })

                if (!response.ok) throw new Error('Errore di rete')

                setMessages((prev) => [...prev, { role: 'assistant', content: '' }])
                setIsTyping(true)
                
                const reader = response.body?.getReader()
                if (!reader) return
                
                let accumulatedContent = ''
                const decoder = new TextDecoder()
                let leftover = ''

                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break
                    
                    const chunk = decoder.decode(value, { stream: true })
                    
                    /**
                     * le linee arrivano in questo modo:
                     * ["data: {\"type\":\"token\",\"content\":\"!\"}",""]
                     */
                    const lines = (leftover + chunk).split('\n')
                    leftover = lines.pop() || ''
                    
                    for (const line of lines) {
                        const trimmedLine = line.trim()
                        if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue
                        
                        const jsonString = trimmedLine.replace('data: ', '')
                        try {
                            const parsed = JSON.parse(jsonString)

                            // GESTIONE SESSIONE: Se il backend ci manda l'ID, salviamolo
                            if (parsed.type === 'session_id') {
                                sessionIdRef.current = parsed.content
                                continue
                            }

                            if (parsed.type === 'error') {
                                setError(parsed.error.message)
                                setMessages((prev) => prev.slice(0, -1))
                                return
                            }

                            if (parsed.type === 'token') {
                                accumulatedContent += parsed.content
                                setMessages((prev) => {
                                    const newMessages = [...prev]
                                    newMessages[newMessages.length - 1].content = accumulatedContent
                                    return newMessages
                                })
                            }
                        } catch (e) { console.warn(e) }
                    }
                }
            } catch (error) {
                setError('Errore di connessione.')
            } finally {
                setIsLoading(false)
                setIsTyping(false)
            }
        },
        [accessToken] // Tolto [messages] per evitare ricreazioni inutili dell'hook
    )

    return { error, messages, isLoading, isTyping, sendMessage }
}