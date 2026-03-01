/**
 * Come avviene la validazione ? 
 * 
 * 1.   Richiesta in arrivo: Un client invia un JSON al tuo endpoint.
 * 
 * 2.   Validazione (AJV): Fastify prende il tuo RootResponseSchema e lo passa a una 
 *      libreria interna chiamata AJV (Another JSON Schema Validator).
 * 
 * 3.   Il "Muro": Se lo schema dice che serve un campo email e il client non lo manda, 
 *      AJV blocca la richiesta prima che arrivi al tuo codice. Risponde automaticamente 
 *      con un 400 Bad Request.
 * 
 * 4.   Esecuzione del codice: Se i dati sono validi, Fastify li passa al tuo handler. 
 *      Qui entra in gioco RootResponse (TypeScript): il tuo IDE sa che request.body.email 
 *      esiste e non è un errore.
 * 
 * 5.   Risposta e Serializzazione: Quando fai return { ... }, Fastify usa di nuovo 
 *      lo schema per ripulire la risposta (es. rimuove campi extra che non avevi definito 
 *      nello schema) e la invia al client.
 * 
 */
import { Type, Static} from  '@sinclair/typebox'; 

export const RootResponseSchema =  Type.Object({
    status: Type.String(),
    message: Type.String()
});

export type RootResponse = Static<typeof RootResponseSchema>;