/**
 * @note
 * AiAgentController utilizza internamente questo hook. 
 * In particolare il componente utilzzerà:
 * error, messages, isLoading, isTyping, sendMessage
 * per gestire la comunicazione lato server.
 */

import { useCallback, useEffect, useState } from "react"
import { chatService } from "../services/chat.service"

// Il client vede solo messaggi dell'utente  e dell'assistente. 
interface Message {
    content: string, 
    role: 'user' | 'assistant'
}

const welcomeMessage: Message = { 
    content: "Ciao sono Gargamella l'assistente virtuale di ADHR GROUP, come posso aiutarti oggi? ",
    role: 'assistant'
}

export function useChat(initialSessionId: string | undefined) {
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [isTyping, setIsTyping] = useState<boolean>(false)
    const [messages, setMessages] = useState<Message[]>([welcomeMessage])

    /**
     * @note
     * 
     * Il ciclo di vita di un componente passa per le seguenti fasi:
     * 
     * 0.   Montaggio - quando nasce il componente inserito per la prima volta nel DOM con append() 
     * 
     * 1.   Rendering - ( se è il primo rendering, viene fatto un append ). Durante il rendering il 
     *      componente viene eseguito da react, il template prodotto viene comparato ( diffing ) con 
     *      quello precedente, e le differenze vengono aggiornate. 
     * 
     * 2.   Smontaggio - Il componente viene rimosso dal DOM e distrutto.
     * 
     * useEffect() viene eseguito una sola volta quando il componente appare sullo schermo se passiamo
     * come secondo argomento []
     * 
     * se invece passiamo [var] la funzione passata a useEffect viene eseguita tutte le volte che 
     * cambia var 
     * 
     * se da useEffect() ritorniamo una funzione, allora questa viene eseguita durante lo smontaggio
     * del componente. 
     * 
     * Effetto per caricare i messaggi se cambiamo sessione dall'URL (es. cliccando sulla sidebar)
     */     

useEffect(() => {
        async function loadHistory() {
            if (initialSessionId && initialSessionId !== 'new') {
                setIsLoading(true)
                try {

                    const history = await chatService.getHistory(initialSessionId)
                    // Mappiamo i messaggi se il formato del backend è diverso
                    setMessages(history)
                } catch (e) {
                    setError("Impossibile caricare lo storico")
                } finally {
                    setIsLoading(false)
                }
            } else {
                // Reset per nuova chat
                setMessages([{ role: 'assistant', content: "Ciao! Come posso aiutarti?" }])
            }
        }

        loadHistory()
    }, [initialSessionId]) // <--- Importante: scatta ogni volta che clicchi sulla sidebar

    /**
     * @note
     * Sostanzialmente il componente che utilizza questo hook, viene riesegito 
     * a ogni singolo token o chunk di testo che arriva via Server-Side Events (SSE), 
     * perchè lo stato messages cambia.
     * Senza useCallback, ogni volta che il componente X ( che usa questo hook ) viene ri-eseguito:
     * 
     * 1.   JavaScript legge la riga dove definisci la tua funzione (es. const handleSend = () => { ... }).
     * 
     * 2.   Viene creata una nuova istanza di quella funzione in RAM.
     * 
     * 3.   Per JavaScript, quella funzione è "nuova" (anche se il codice dentro è identico), 
     *      quindi il riferimento di memoria cambia.
     * 
     */
    const sendMessage = useCallback(
        async (content: string) => {
            const usrMsg: Message = { role: 'user', content }
            setMessages((prev) => [...prev, usrMsg])
            setIsLoading(true)
            try {
                
                setError(null)
                
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        message: content,                        
                        // Usiamo l'ID dell'URL, se non c'è il backend ne creerà uno
                        sessionId: initialSessionId === 'new' ? undefined : initialSessionId 
                    }),
                })

                if (!response.ok) throw new Error('Errore di rete')
                
                // Attendiamo la risposta del server. ReadableStreamDefaultReader
                // è lo strumento nativo del browser per leggere uno stream chunk dopo chunk
                setMessages((prev) => [...prev, { role: 'assistant', content: '' }])
                setIsTyping(true)
                const reader = response.body?.getReader()
                if (!reader) return

                // Ci attrezziamo per decodificare quanto arriva dal server:
                let accumulatedContent = ''
                const decoder = new TextDecoder()
                let leftover = ''
                // Invece del vecchio eventi + callback utilizziamo Iteration Protocol 
                while(true) {

                    // qui ci mettiamo in pausa finché si verifica uno di questi due casi: 
                    // 1. arriva un pezzetto di dati dal server
                    // 2. il server mi dice che ha finito.
                    const { done, value} = await reader.read() 
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
                            
                            // Redirect se nuova sessione
                            if (parsed.type === 'session_id') {
                                const newId = parsed.content
                                
                                // Se siamo in una "nuova chat", aggiorniamo l'URL senza refresh
                                // L'utente inizia su /ai-agent, scrive il primo messaggio, 
                                // e mentre l'AI risponde, l'URL diventa /ai-agent/uuid-generato. 
                                // Se l'utente ricarica la pagina o salva il link, si ritrova 
                                // esattamente in quella conversazione. 
                                
                                if (!initialSessionId || initialSessionId === 'new') {
                                    window.history.replaceState(null, '', `/ai-agent/${newId}`)
                                }
                                continue
                            }

                            if (parsed.type === 'token') {
                                accumulatedContent += parsed.content
                                setMessages((prev) => {
                                    const newMessages = [...prev]
                                    newMessages[newMessages.length - 1].content = accumulatedContent
                                    return newMessages
                                })
                            }

                            if (parsed.type === 'error') {
                                setError(parsed.error.message)
                                setMessages((prev) => prev.slice(0, -1))
                                return
                            }

                        } catch(error) {
                            console.warn(error)
                        }
                    }
                }
                
            } catch(error) {
                setError('Errore di connessione.')
            } finally {
                setIsLoading(false)
                setIsTyping(false)
            }      
        }, [initialSessionId]
    )

    return { error, messages, isLoading, isTyping, sendMessage }
}