import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { Agent, request as undiciRequest } from 'undici'; // Alias per evitare conflitti

const timeoutAgent = new Agent({
  headersTimeout: 6000000, // 100 minuti
  bodyTimeout: 6000000,
  connectTimeout: 600000 
});

export async function POST(req: NextRequest) { // Cambiato in 'req'
    try {
        const contentType = req.headers.get('content-type')
        
        if (!contentType?.includes('application/json')) {
            return NextResponse.json({ error: 'Invalid Content-Type' }, { status: 400 })
        }
         
        const token = await getToken({ 
            req,
            secret: process.env.AUTH_SECRET, 
        })

        if (!token || !token.accessToken) {
            return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
        }

        let jsonBody; 
        try {
            jsonBody = await req.json()
        } catch (e) {
            return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400 })
        }

        const backendUrl = process.env.API_BACKEND_URL || 'http://localhost:3002'
        const abortController = new AbortController()
        
        // Timeout di sicurezza sincronizzato con l'agent (10 minuti)
        const timeoutId = setTimeout(() => abortController.abort(), 600000)

        // Al primo invio non c'è sessionId : {"message":"ciao"}
        // Usiamo undiciRequest per supportare correttamente il dispatcher
        const { body, statusCode, headers: responseHeaders } = await undiciRequest(`${backendUrl}/api/v1/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token.accessToken}`,
            },
            body: JSON.stringify(jsonBody),
            dispatcher: timeoutAgent,
            signal: abortController.signal,
        });

        clearTimeout(timeoutId)

        // Verifica dello status tramite il codice restituito da undici
        if (statusCode < 200 || statusCode >= 300) {
            console.error(`Backend Error (${statusCode})`);
            return new Response(`Errore backend chat service`, { status: statusCode });
        }

        if (!body) {
            return NextResponse.json({ error: 'Nessuna risposta dal backend' }, { status: 500 })
        }

        /**
         * @note Bridge dello Stream
         * 'body' restituito da undici è un ReadableStream compatibile con il costruttore Response.
         */
        return new Response(body as any, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache, no-transform',
                'Connection': 'keep-alive',
                'X-Accel-Buffering': 'no' // Fondamentale per NGINX
            },
        })

    } catch (error: any) {
        if (error.name === 'AbortError') {
            return new Response(JSON.stringify({ error: 'Il server ha impiegato troppo tempo a rispondere (Timeout)' }), { status: 504 })
        }
        console.error('Errore nella Route API di Next.js:', error)
        return new Response(JSON.stringify({ error: 'Errore interno' }), { status: 500 })
    }
}       