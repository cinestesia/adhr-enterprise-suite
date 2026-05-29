// Server inizializzo la risposta per supportare Server Side Event

import { FastifyReply } from 'fastify/types/reply'
import { once } from 'events'

/**
 * @note
 * Questo serve a inizializzare una cossessione SSE ( Server Sent Events )
 * prepara il server per inviare dati al client (il browser) in tempo
 * reale e a flusso continuo, senza che la connessione venga chiusa
 * dopo la prima risposta.
 *
 * Accede all'oggetto di risposta nativo di Node.js (reply.raw)
 * e invia immediatamente lo status code 200 OK insieme agli header richiesti
 * per il SSE.
 *
 * Diciamo al client: "La richiesta è stata accettata, ora tieni la linea aperta".
 */
export function initSSE(reply: FastifyReply) {
    reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        //ricevo token in tempo reale senza chiudere la connessione
        Connection: 'keep-alive',
    })
}

export async function sendSSE(reply: FastifyReply, payload: unknown) {
    const data = `data: ${JSON.stringify(payload)}\n\n`

    /**
     * @note
     * gestione backpressure. Se il client è lento a consumare i TOKEN il buffer di
     * risposta si riempie e write ritorna false quando il buffer è pieno, quindi
     * aspettiamo l'evento 'drain' prima di inviare altri dati.
     * ma cos'è il drain? è un evento standard di Node.js che viene emesso quando
     * il buffer di scrittura è stato svuotato e può accettare nuovi dati e che significa
     * once? è una funzione helper di Node.js che permette di ascoltare un evento una
     * sola volta, restituendo una Promise che si risolve quando l'evento viene emesso.
     * In questo caso, aspettiamo che il buffer sia pronto per accettare nuovi dati prima
     * di continuare a inviare la risposta al client.
     */

    if (!reply.raw.write(data)) {
        await once(reply.raw, 'drain')
    }
}
