import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
    try {

        const body = await request.json()
        const backendUrl = process.env.AI_BACKEND_URL || 'http://localhost:3002'
        const response = await fetch(`${backendUrl}/api/v1/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        })

        if (!response.ok) {
            const errorText = await response.text()
            return new Response(`Errore backend: ${errorText}`, {
                status: response.status,
            })
        }

        // Il backend risponde con uno stream, lo passiamo direttamente al client!
        // Usiamo il TransformStream per fare il pipe della risposta grezza
        const stream = response.body

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive',
            },
        })
    } catch (error: any) {
        console.error('Errore nella Route API di Next.js:', error)
        return new Response(JSON.stringify({ error: 'Errore interno del server' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
