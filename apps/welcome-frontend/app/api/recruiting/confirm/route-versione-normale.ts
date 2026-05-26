import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function POST(req: NextRequest) {
    try {
        // 1. Recuperiamo il token di sessione sicuro
        const token = await getToken({
            req,
            secret: process.env.AUTH_SECRET,
        })

        if (!token || !token.accessToken) {
            return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
        }

        // 2. Leggiamo il body JSON inviato dal client
        const jsonBody = await req.json()
        const backendUrl = process.env.API_BACKEND_URL || 'http://localhost:3002'

        // 3. Inoltriamo il JSON a Fastify
        const response = await fetch(`${backendUrl}/api/v1/recruiting/confirm`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token.accessToken}`,
            },
            body: JSON.stringify(jsonBody),
        })

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}))
            return NextResponse.json(
                {
                    message:
                        errData.message ||
                        'Impossibile salvare il candidato nel database',
                },
                { status: response.status }
            )
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error: any) {
        console.error('Errore nella Route API Next Recruiting Confirm:', error)
        return NextResponse.json(
            { error: 'Errore interno del server proxy' },
            { status: 500 }
        )
    }
}
