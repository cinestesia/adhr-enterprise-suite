// Server inizializzo la risposta per supportare Server Side Event

import { FastifyReply } from 'fastify/types/reply'
import { once } from 'events'

export function initSSE(reply: FastifyReply) {
    reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive', //ricevo token in tempo reale senza chiudere la connessione
    })
}

export async function sendSSE(reply: FastifyReply, payload: unknown) {
    const data = `data: ${JSON.stringify(payload)}\n\n`

    // gestione backpressure. Se il client è lento a consumare i TOKEN il buffer di risposta si riempie
    // write ritorna false quando il buffer è pieno, quindi aspettiamo l'evento 'drain' prima di inviare altri dati
    // ma cos'è il drain? è un evento standard di Node.js che viene emesso quando il buffer di scrittura è stato
    // svuotato e può accettare nuovi dati e che significa once? è una funzione helper di Node.js che permette
    // di ascoltare un evento una sola volta, restituendo una Promise che si risolve quando l'evento viene emesso.
    // In questo caso, aspettiamo che il buffer sia pronto per accettare nuovi dati prima di continuare a inviare
    // la risposta al client.

    if (!reply.raw.write(data)) {
        await once(reply.raw, 'drain')
    }
}
