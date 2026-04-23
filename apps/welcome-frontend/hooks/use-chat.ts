import { useState, useCallback } from 'react'

/**
 *
 * Tu scrivi: "Ciao". -> LLM risponde: "Ehi!".
 *
 * Tu scrivi: "Come va?". -> L'app manda:
 * [User: Ciao] + [Assistant: Ehi!] + [User: Come va?].
 *
 *
 *
 */
export interface Message {
    role: 'user' | 'assistant'
    content: string
}

export function useChat() {
    const [error, setError] = useState<string | null>(null)
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: "Ciao! Sono l'assitente AI Aziendale. Come posso aiutarti?",
        },
    ])

    const [isLoading, setIsLoading] = useState(false)

    // Aggiungiamo uno stato per capire se il server ha risposto al primo byte
    const [isTyping, setIsTyping] = useState(false)

    /**
     *
     * In JavaScript, ogni volta che un componente viene renderizzato,
     * tutte le funzioni definite al suo interno vengono create ex-novo.
     * Senza useCallback, la funzione sendMessage sarebbe un oggetto
     * nuovo ogni volta che scrivi un carattere nell'input o arriva un
     * token dall'AI).
     *
     * Quando inviamo lo storico, non dobbiamo mandare proprio tutti i messaggi
     * ( se la chat dura ore, supereremo il limite di token del modello),
     * ma di solito si inviano gli ultimi 10-20 messaggi.
     *
     *
     *
     */
    const sendMessage = useCallback(
        async (content: string) => {
            if (!content.trim()) return
            const usrMsg: Message = { role: 'user', content } // messaggio corrente
            const updatedHistory = [...messages, usrMsg] // history

            setMessages((prev) => {
                console.log('DEB:', [...prev, usrMsg])
                return [...prev, usrMsg]
            })
            // es. [ { role: "assistant", content: "Ciao! Sono l'assitente AI Aziendale. Come posso aiutarti?" } ]
            setIsLoading(true)

            try {
                setError(null)

                const response = await fetch('api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages: updatedHistory }),
                })

                // es. [
                //  { role: "assistant", content: "Ciao! Sono l'assitente AI Aziendale. Come posso aiutarti?" },
                //  { role: "assistan", content: '' }
                // ]
                setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

                setIsTyping(true)

                const reader = response.body?.getReader()

                if (!reader) return

                let accumulatedContent = ''

                /**
                 * TextDecoder fa parte delle API browser moderni e anche di Node.js
                 * che serve a convertire flussi di dati binari (come byte)
                 * in stringhe di testo leggibili.
                 */

                const decoder = new TextDecoder()
                let leftover = ''

                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break
                    const chunk = decoder.decode(value, { stream: true })

                    // Dividiamo il chunk in righe (un chunk può contenere più righe data:)
                    const combined = leftover + chunk
                    const lines = combined.split('\n')
                    // L'ultima riga potrebbe essere incompleta, la salviamo per il prossimo giro
                    leftover = lines.pop() || ''

                    for (const line of lines) {
                        const trimmedLine = line.trim()
                        if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue
                        const jsonString = trimmedLine.replace('data: ', '')

                        try {
                            const parsed = JSON.parse(jsonString)
                            // 1. Gestione errore specifico inviato dal backend
                            if (parsed.type === 'error') {
                                setError(
                                    parsed.error.message ||
                                        'Errore durante la generazione'
                                )

                                // Rimuove la bolla vuota dell'assistente
                                setMessages((prev) => prev.slice(0, -1))
                                // SCELTA 1 ==> break; // Esci dal ciclo di streaming
                                // SCELTA 2 ==> return; // Esce da tutto: for, while e sendMessage
                                // SCELTA 3 ==> await reader.cancel(); // Chiude il flusso lato client
                                // break ( MA DEVI AVERE UN MODO DI USCIRE DAL WHILE )
                                return
                            }

                            if (parsed.content) {
                                accumulatedContent += parsed.content
                                setMessages((prev) => {
                                    const newMessages = [...prev]
                                    const lastIndex = newMessages.length - 1
                                    newMessages[lastIndex] = {
                                        ...newMessages[lastIndex],
                                        content: accumulatedContent,
                                    }

                                    return newMessages
                                })
                            }
                        } catch (e) {
                            // Ignoriamo righe che non sono JSON valido (es: messaggi di [DONE])
                            console.warn('Errore parsing chunk:', e)
                        }
                    }
                }
            } catch (error) {
                setError(
                    'Non sono riuscito a rispondere. Controlla la connessione o riprova più tardi.'
                )
            } finally {
                setIsLoading(false)
                setIsTyping(false)
            }
        },
        [messages]
    ) // se messages cambia scatta una foto della situazione e aggiorna sendMessage

    return {
        error,
        messages,
        isLoading,
        isTyping,
        sendMessage,
    }
}
