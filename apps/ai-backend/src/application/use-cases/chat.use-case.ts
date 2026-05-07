import { IChatRepository } from '@/domain/ports/chat-repository.port'
import { IChatPort } from '@/domain/ports/chat.port'
import { IVectorDbPort } from '@/domain/ports/vector-db.port'
import { IterableReadableStream } from '@langchain/core/utils/stream'
import { ChatRequestDTO } from '@/dtos/chat-request.dto'
import { ChatMessage } from '@/domain/models/chat-message.model' 
import { randomUUID } from 'crypto'

interface ChatUseCaseOutput {
    stream: IterableReadableStream<string>
    sessionId: string
}

export class ChatUseCase {
    constructor(
        private aiGateway: IChatPort,
        private vectorDb: IVectorDbPort,
        private chatRepo: IChatRepository
    ) {}

    /**
     * Genera il titolo in modo asincrono (fire and forget)
     */
    private async generateTitleBackground(sessionId: string, userMessage: string) {
        try {
            const prompt = `Genera un titolo sintetico (max 5 parole) per una chat che inizia con: "${userMessage}". Rispondi SOLO con il titolo, senza virgolette.`
            const title = await this.aiGateway.predict(prompt)
            await this.chatRepo.updateSessionTitle(sessionId, title.trim())
        } catch (err) {
            console.error("[ChatUseCase] Background title generation failed:", err)
        }
    }

    async execute(dto: ChatRequestDTO): Promise<ChatUseCaseOutput> {
        const { message, user } = dto
        let { sessionId } = dto
        const department = user.mainDepartment
        let isNewSession = false

        try {
            /**
            * @note - CASO A: Nuova sessione.
            * L'utente apre la pagina della chat. Il client non ha un sessionId.
            * Invia la prima richiesta senza sessionId, il backend ne crea uno nuovo e lo restituisce.
            * Inizialmente creiamo con un titolo provvisiorio e poi lo aggiorniamo dopo.  
            */
            if (!sessionId) {
                sessionId = randomUUID()
                isNewSession = true
                await this.chatRepo.createSession(sessionId, user.id, `Conversazione ${department}`)
            } else {
                const isOwner = await this.chatRepo.checkSessionOwnership(sessionId, user.id)
                if (!isOwner) throw new Error('Accesso negato: sessione non valida')
            }

            // 2. Recupero History (Ora sono istanze di ChatMessage)
            const history = await this.chatRepo.getMessagesBySessionId(sessionId, 10)

            // 3. Titolo asincrono se prima interazione, non blocchiamo la chat per questo.
            if (isNewSession || history.length === 0) {
                this.generateTitleBackground(sessionId, message)
            }

            // 4. Salvataggio Messaggio Utente (Creiamo l'istanza di Dominio)
            const userMsg = new ChatMessage('user', message)
            await this.chatRepo.saveMessage(sessionId, userMsg)

            // 5. RAG & Augmented History
            let augmentedHistory: ChatMessage[] = [...history]

            if (this.vectorDb) {
                const chunks = await this.vectorDb.similaritySearch(message, 4, { department })

                if (chunks.length > 0) {
                    const context = chunks.map((c) => c.content).join('\n\n---\n\n')
                    
                    // Creiamo il System Message come istanza di ChatMessage
                    const systemMsg = new ChatMessage(
                        'system', 
                        `Sei un assistente tecnico di ADHR Group per il dipartimento ${department}. 
                         Rispondi basandoti RIGOROSAMENTE sul CONTESTO fornito.
                         CONTESTO: ${context}`
                    )
                    
                    augmentedHistory = [systemMsg, ...history]
                }
            }

            // 6. Chiamata AI & Streaming
            const aiStream = await this.aiGateway.chat(message, augmentedHistory)
            
            return {
                stream: this.wrapStreamToSave(aiStream, sessionId),
                sessionId
            }

        } catch (error) {
            console.error('[ChatUseCase] Error:', error)
            throw error
        }
    }

    private wrapStreamToSave(stream: any, sessionId: string): IterableReadableStream<string> {
        const chatRepo = this.chatRepo

        async function* generator() {
            let fullContent = ''
            for await (const chunk of stream) {
                fullContent += chunk
                yield chunk
            }

            // Quando salviamo la risposta, creiamo l'oggetto di Dominio
            const assistantMsg = new ChatMessage('assistant', fullContent)
            await chatRepo.saveMessage(sessionId, assistantMsg)
        }

        return IterableReadableStream.fromAsyncGenerator(generator())
    }
}

/**
 * @note 👍/👎
 * Un LLM come Llama 3.1 non "impara" istantaneamente dai feedback mentre chatta
 * (i pesi del modello sono statici). Tuttavia, puoi usare i feedback degli utenti
 * per innescare un ciclo di miglioramento continuo molto efficace.
 *
 * Ecco i tre modi in cui il tuo chatbot può "evolversi" grazie ai feedback:
 *
 * 1.   Il Feedback come "Filtro di Qualità" (RLHF Semplificato)
 *      Se aggiungi i tastini 👍/👎, puoi memorizzare nel database non solo il feedback,
 *      ma anche il triangolo d'oro: Domanda dell'utente + Contesto fornito dal VectorDB + Risposta del bot.
 *
 * 2.   Cosa te ne fai: Analizzando i "pollici versi", potresti scoprire che il problema non è il chatbot,
 *      ma il documento originale (magari scritto in modo ambiguo) o che il VectorDB sta recuperando i pezzi
 *      di testo (chunks) sbagliati.
 *
 * 3.   Miglioramento: Puoi correggere il documento sorgente o regolare i parametri di ricerca
 *      (il k=4 che nel codice).
 *
 * @note 👍/👎
 * Creazione di una "Few-Shot Memory" (Esempi d'oro)
 * Questa è la tecnica più veloce per migliorare senza riprogrammare tutto.
 *
 * Prendi le domande a cui il bot ha risposto perfettamente (confermato dai 👍 degli utenti).
 * Inserisci questi esempi direttamente nel System Prompt come modelli da seguire.
 *
 * Esempio: "Ecco come rispondere correttamente: [Domanda Utente] -> [Risposta approvata]".
 * Llama 3.1 è bravissimo a imitare lo stile e la precisione degli esempi che gli fornisci.
 *
 * Fine-Tuning (Il livello Pro)
 * Se accumuli migliaia di feedback, puoi decidere di fare il "Fine-Tuning" del modello.
 *
 * In pratica, prendi Llama 3.1 e lo ri-addestri leggermente usando i tuoi dati aziendali e
 * le correzioni degli utenti.
 *
 * Risultato: Il modello diventerà nativamente esperto del linguaggio della tua azienda e
 * delle procedure di InRecruiting, riducendo la dipendenza dal messaggio di sistema.
 *
 * Dovresti aggiungere un passaggio dopo la ricezione della risposta:
 *
 * 1.   UI: L'utente clicca 👎.
 *      Azione: Il sistema salva in una tabella feedbacks la domanda, il contesto usato e la risposta errata.
 * 2.   Revisione: Una volta a settimana, controlli i 👎. Se vedi che il bot ha inventato di nuovo i "tasti rossi",
 *      aggiorni il documento FAQ o il prompt di sistema per essere ancora più severo.
 *
 * Un'idea "Smart": L'Auto-Correzione
 * Alcuni sistemi usano un secondo LLM (chiamato Judge) che analizza il feedback negativo e suggerisce come avrebbe
 * dovuto rispondere il primo. Puoi usare questi suggerimenti per aggiornare automaticamente
 * la tua base di conoscenza.
 *
 * In sintesi: Il feedback non cambia i "neuroni" del bot all'istante, ma ti dà la mappa per capire dove devi
 * stringere le viti del sistema.
 *
 * come strutturare la tabella per i feedback o a come rifinire il prompt in
 * base agli errori?
 */
