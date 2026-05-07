import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt' // Assumendo che tu usi next-auth

export async function POST(request: NextRequest) {
    try {

        /** 
         * @note
         * Recuperiamo il token dalla sessione di Next.js (lato server)
         * il token viene recuperato dal cookie della richiesta e verificato 
         * tramite next-auth
         * 
         * L' accessToken e l' idToken non sono inclusi automaticamente 
         * nell'oggetto ritornato da getToken() a meno che non siano stati 
         * esplicitamente salvati nel JWT durante la fase di login.
         * 
         * l'accessToken è fondamentale per autenticare la richiesta al backend, mentre l'idToken 
         * è più utile per il logout (per invalidare la sessione lato Keycloak).
         * 
         * l'idToken contiene le informazioni sull'identità dell'utente (nome, email, ecc.)
         * e per esempio è fondamentale per il logout. 
         * 
         */
        const contentType = request.headers.get('content-type')
        
        if (!contentType?.includes('application/json')) {
            return NextResponse.json({ error: 'Invalid Content-Type' }, { status: 400 })
        }
        
        
        const token = await getToken({ req: request })

        if (!token || !token.accessToken) {
            return new Response(JSON.stringify({ error: 'Non autorizzato' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            })
        }

        // Validazione minima del body.
        let body; 

        try {
            body = await request.json()
        } catch (e) {
            return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400 })
        }

        const backendUrl = process.env.API_BACKEND_URL || 'http://localhost:3002'

        if (!backendUrl) {
            console.error("Missing API_BACKEND_URL env var")
            return NextResponse.json({ error: 'Configurazione server errata' }, { status: 500 })
        }

        const abortController = new AbortController()
        const timeoutId = setTimeout(() => abortController.abort(), 60000) // Timeout di sicurezza 60s 


        const response = await fetch(`${backendUrl}/api/v1/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Passiamo l'AccessToken che il backend verificherà tramite Keycloak
                'Authorization': `Bearer ${token.accessToken}`,
            },
            body: JSON.stringify(body),
            signal: abortController.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Errore sconosciuto')
            console.error(`Backend Error (${response.status}):`, errorText)
            return new Response(`Errore backend chat service: ${errorText}`, {
                status: response.status,
            })
        }

        if (!response.body) {
            return NextResponse.json({ error: 'Nessuna risposta dal backend' }, { status: 500 })
        }

        // 3. Ritorno dello stream al client
        return new Response(response.body, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache no-transform',
                'Connection': 'keep-alive',
                
                /**
                 * @note
                 * Se stai usando NGINX come reverse proxy, è fondamentale disabilitare il buffering per questa route.
                 * Altrimenti, NGINX aspetterà che tutto lo stream sia completo prima di inviarlo al client, vanificando lo streaming.
                 */
                'X-Accel-Buffering': 'no'
            },
        })
    } catch (error: any) {
        console.error('Errore nella Route API di Next.js:', error)
        return new Response(JSON.stringify({ error: 'Errore interno' }), { status: 500 })
    }
}