// app/api/health/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
    // Qui puoi aggiungere logica extra (es. check database) 
    // ma per una sonda base basta restituire 200 OK
    // Il primo argomento è il body
    return NextResponse.json(
        { status: 'ok', timestamp: new Date().toISOString() },
        { status: 200 } // http response code 
    );
}


// Secondo Argomento: Le "Options" (I Metadati)
// { status: 200 }

// Questo oggetto serve a configurare la risposta HTTP stessa. Qui puoi definire:

// status: Il codice di stato HTTP (200 per il successo, 404 per non trovato, 500 per errore, ecc.).

// headers: Se volessi aggiungere dei cookie o degli header personalizzati.


// Kubernetes (il Kubelet) non legge il contenuto JSON (il primo argomento). A lui non importa se scrivi 
// { "status": "ok" } o { "tutto": "bene" }.

// Kubernetes guarda solo il secondo argomento, ovvero il codice di stato HTTP:

// Se riceve un valore compreso tra 200 e 399, la sonda ha successo.

// Se riceve qualunque altra cosa (es. 401, 404, 500), la sonda fallisce.
