import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export const runtime = 'nodejs' // Obbligatorio in Next.js per gestire flussi FormData pesanti

export async function POST(req: NextRequest) {
    try {
        // 1. Recuperiamo il token di sessione dell'utente tramite NextAuth
        const token = await getToken({
            req,
            secret: process.env.AUTH_SECRET,
        })

        if (!token || !token.accessToken) {
            return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
        }

        // 2. Estraiamo il file (FormData) inviato dal browser
        const formData = await req.formData()
        const file = formData.get('file')

        if (!file) {
            return NextResponse.json(
                { error: 'Nessun file trovato nella richiesta' },
                { status: 400 }
            )
        }

        // 3. Prepariamo un nuovo FormData da inviare a Fastify
        const backendUrl = process.env.API_BACKEND_URL || 'http://localhost:3002'
        const backendFormData = new FormData()
        backendFormData.append('file', file)

        // 4. Inoltriamo la richiesta al backend Fastify sulla porta corretta
        const response = await fetch(`${backendUrl}/api/v1/recruiting/extract`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token.accessToken}`,
                // Nota: NON impostare manualmente il Content-Type qui, il fetch lo calcola da solo con i boundary corretti
            },
            body: backendFormData,
        })

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}))
            return NextResponse.json(
                {
                    message:
                        errData.message ||
                        'Errore durante l’estrazione del modulo backend',
                },
                { status: response.status }
            )
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error: any) {
        console.error('Errore nella Route API Next Recruiting Extract:', error)
        return NextResponse.json(
            { error: 'Errore interno del server proxy' },
            { status: 500 }
        )
    }
}
