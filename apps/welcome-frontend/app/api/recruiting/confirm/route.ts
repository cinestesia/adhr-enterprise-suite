import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { Agent, request as undiciRequest } from 'undici'

const timeoutAgent = new Agent({
    headersTimeout: 6000000,
    bodyTimeout: 6000000,
    connectTimeout: 600000,
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

        let jsonBody
        try {
            jsonBody = await req.json()
        } catch (e) {
            return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400 })
        }

        const backendUrl = process.env.API_BACKEND_URL || 'http://localhost:3002'
        const abortController = new AbortController()
        const timeoutId = setTimeout(() => abortController.abort(), 6000000)

        const { body, statusCode } = await undiciRequest(
            `${backendUrl}/api/v1/recruiting/confirm`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token.accessToken}`,
                },
                body: JSON.stringify(jsonBody),
                dispatcher: timeoutAgent,
                signal: abortController.signal,
            }
        )

        clearTimeout(timeoutId)

        if (statusCode < 200 || statusCode >= 300) {
            console.error(`Backend Confirm Error (${statusCode})`)
            return new Response(`Errore backend recruiting service (Confirm)`, {
                status: statusCode,
            })
        }

        if (!body) {
            return NextResponse.json(
                { error: 'Nessuna risposta dal backend' },
                { status: 500 }
            )
        }

        const responseData = await body.json()
        return NextResponse.json(responseData)
    } catch (error: any) {
        if (error.name === 'AbortError') {
            return new Response(
                JSON.stringify({ error: 'Timeout durante la conferma del candidato' }),
                { status: 504 }
            )
        }
        console.error('Errore nella Route API Next Recruiting Confirm (Undici):', error)
        return new Response(JSON.stringify({ error: 'Errore interno' }), { status: 500 })
    }
}
