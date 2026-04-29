import { IChatPort } from '@/domain/ports/chat.port'
import { IVectorDbPort } from '@/domain/ports/vector-db.port'
import { IterableReadableStream } from '@langchain/core/utils/stream'

export class ChatUseCase {
    constructor(
        private aiGateway: IChatPort,
        private vectorDb: IVectorDbPort,
    ) {}

    async execute(
        message: string, // es. ciao come va?
        history: any[] = [], // es. [ { role: "assistant", content: "Ciao! Sono l'assitente AI Aziendale. Come posso aiutarti?" } ]
        department?: string // <--- Opzionale, per filtrare i documenti in base al dipartimento
    ): Promise<IterableReadableStream<string>> {
        if (!message || message.trim() === '') {
            throw new Error('Il messaggio non può essere vuoto')
        }

        try {
            if (!this.vectorDb) {
                console.warn(
                    '[ChatUseCase] VectorDB non inizializzato, procedo in modalità chat standard'
                )
                return await this.aiGateway.chat(message, history)
            }

            // LIMITIAMO LA HISTORY: prendiamo solo gli ultimi 6 scambi (es. 3 domande e 3 risposte)
            // Questo evita che la chat si gonfi all'infinito e mantiene l'attenzione sui temi recenti.
            const limitedHistory = history.slice(-6)

            /**
             * @note
             * Per documenti molto lunghi o complessi, bisogna tenere d'occhio il valore di k nel
             * similaritySearch (attualmente è 4). Se le risposte dovessero tornare a essere vaghe,
             * potrebbe essere necessario aumentare questo valore per dare al modello più "pezzi" di contesto,
             * ma per FAQ così dirette, 4 è solitamente il numero magico.
             */
            const chunks = await this.vectorDb.similaritySearch(message, 4, {
                department,
            })

            // Creiamo una copia della history per non sporcare quella originale
            let augmentedHistory = [...limitedHistory]

            let finalMessage = message // es. ciao come va?

            // AUGMENTATION (Se abbiamo trovato documenti pertinenti)
            if (chunks.length > 0) {
                const context = chunks.map((c) => c.content).join('\n\n---\n\n')

                const systemInstruction = {
                    role: 'system',
                    content: `Sei un assistente tecnico aziendale. 
                    Rispondi alle domande basandoti RIGOROSAMENTE sul CONTESTO fornito.
                    - Non inventare passaggi tecnici o nomi di menu.
                    - Se il contesto non contiene la risposta, di' chiaramente che non lo sai.
                    - Non usare conoscenze esterne al di fuori del CONTESTO.
                    
                    CONTESTO:
                    ${context}`,
                }

                augmentedHistory = [systemInstruction, ...limitedHistory]

                // es. augmentedHistory diventa: [
                //     { role: "system", content: "Sei un assistente ....  CONTESTO: [estratto dei documenti]" }
                //     { role: "assistant", content: "Ciao! Sono l'assitente AI Aziendale. Come posso aiutarti?" },
                // ]
            }

            const response = await this.aiGateway.chat(finalMessage, augmentedHistory)
            return response
        } catch (error) {
            console.error('Error in ChatUseCase:', error)
            throw new Error("Errore durante l'elaborazione della chat")
        }
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
