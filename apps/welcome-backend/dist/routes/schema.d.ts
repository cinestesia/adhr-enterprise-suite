/**
 *      @SERIALIZZAZIONE_RISPOSTA
 *
 *      Risposta e Serializzazione: Quando fai return { ... }, Fastify usa di nuovo
 *      lo schema per ripulire la risposta (es. rimuove campi extra che non avevi definito
 *      nello schema) e la invia al client. In Fastify quando definisci un response
 *      schema, denntro le opzioni di una rotta,  il framework lo utilizza per due
 *      motivi principali: Serializzazione e filtraggio dei dati. A differenza della
 *      validazione dell'input dove se i dati sono errati fastify blocca tutto con
 *      un errore 400, per l'output Fastify usa lo schema per generare una funzione
 *      di serializzazione ottimizzata tramite la libreira fast-json-stringify.
 *      Velocità: Invece di usare il classico JSON.stringify()
 *      (che deve analizzare l'oggetto a runtime), Fastify "sa" già com'è fatto l'oggetto
 *      e costruisce la stringa JSON molto più velocemente.
 *      Filtraggio (Data Privacy): Questa è la parte fondamentale. Se il tuo oggetto contiene
 *      campi sensibili (es. password o internal_id) ma lo schema di risposta non li include,
 *      Fastify li rimuoverà automaticamente prima di inviare la risposta al client.
 *
 *      Cosa succede se i dati non corrispondono?
 *      Se i dati che stai ritornando dal tuo handler non rispettano lo schema:
 *
 *      1.  Campi extra: Vengono semplicemente ignorati e rimossi dal JSON finale.
 *
 *      2.  Campi mancanti o tipi errati: Fastify cercherà di forzare il tipo (coercizione) se possibile.
 *          Se non ci riesce o se un campo obbligatorio manca, la serializzazione potrebbe fallire o
 *          produrre un output parziale.
 *
 *      Nota Bene: Di default, Fastify non blocca la risposta con un errore 500 se lo schema di output
 *      è violato (a meno di errori catastrofici di parsing), ma si limita a "tagliare" i dati per
 *      farli combaciare con lo schema definito.
 */
import { Static } from '@sinclair/typebox';
export declare const RootResponseSchema: import("@sinclair/typebox").TObject<{
    status: import("@sinclair/typebox").TString;
    message: import("@sinclair/typebox").TString;
    errorCode: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
}>;
export type RootResponse = Static<typeof RootResponseSchema>;
//# sourceMappingURL=schema.d.ts.map