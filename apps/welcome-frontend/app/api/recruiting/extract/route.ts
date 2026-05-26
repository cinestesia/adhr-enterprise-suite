import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { Agent, request as undiciRequest } from 'undici'

export const runtime = 'nodejs'

// Configurazione dell'agente Undici con timeout enormi per i test su CPU
const timeoutAgent = new Agent({
    headersTimeout: 6000000, // 100 minuti
    bodyTimeout: 6000000,
    connectTimeout: 600000, // 10 minuti
})

export async function POST(req: NextRequest) {
    try {
        const token = await getToken({
            req,
            secret: process.env.AUTH_SECRET,
        })

        if (!token || !token.accessToken) {
            return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
        }

        const formData = await req.formData()
        const file = formData.get('file')

        if (!file) {
            return NextResponse.json(
                { error: 'Nessun file trovato nella richiesta' },
                { status: 400 }
            )
        }

        const backendUrl = process.env.API_BACKEND_URL || 'http://localhost:3002'
        const backendFormData = new FormData()
        backendFormData.append('file', file)
        
        const multipartWrapper = new Response(backendFormData)
        const computedContentType = multipartWrapper.headers.get('content-type')
        
        const abortController = new AbortController()
        const timeoutId = setTimeout(() => abortController.abort(), 6000000)
        
        console.log("-> Invio a Fastify con Content-Type calcolato:", computedContentType)
        
        const { body, statusCode } = await undiciRequest(
            `${backendUrl}/api/v1/recruiting/extract`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token.accessToken}`,
                    'content-type': computedContentType!,
                },
                body: multipartWrapper.body as any,
                dispatcher: timeoutAgent,
                signal: abortController.signal,
            }
        )
        
        clearTimeout(timeoutId)

        if (statusCode < 200 || statusCode >= 300) {
            console.error(`Backend Extract Error (${statusCode})`)
            return new Response(`Errore backend recruiting service (Extract)`, {
                status: statusCode,
            })
        }

        if (!body) {
            return NextResponse.json(
                { error: 'Nessuna risposta dal backend' },
                { status: 500 }
            )
        }

        /**
         * @note Bridge dello Stream (MODIFICATO 🚀)
         * Invece di fare body.json(), passiamo direttamente il 'body' (ReadableStream)
         * di undici all'interfaccia utente, impostando gli header corretti per l'SSE.
         */
        return new Response(body as any, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache, no-transform',
                Connection: 'keep-alive',
                'X-Accel-Buffering': 'no', // Fondamentale per NGINX in produzione
            },
        })
    } catch (error: any) {
        if (error.name === 'AbortError') {
            return new Response(
                JSON.stringify({
                    error: 'Il server ha impiegato troppo tempo a estrarre il CV (Timeout CPU)',
                }),
                { status: 504 }
            )
        }
        console.error('Errore nella Route API Next Recruiting Extract (Undici):', error)
        return new Response(JSON.stringify({ error: 'Errore interno' }), { status: 500 })
    }
}
