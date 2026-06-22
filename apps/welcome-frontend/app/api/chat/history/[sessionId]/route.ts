import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
// c
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    const { sessionId } = await params
    const token = await getToken({ req, secret: process.env.AUTH_SECRET })

    if (!token?.accessToken)
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const backendUrl = process.env.API_BACKEND_URL || 'http://localhost:3002'

    try {
        // Chiamata al tuo backend Fastify che abbiamo preparato prima
        const res = await fetch(`${backendUrl}/api/v1/chat/history/${sessionId}`, {
            headers: { Authorization: `Bearer ${token.accessToken}` },
        })

        if (!res.ok) throw new Error('History fetch failed')

        const data = await res.json()
        return NextResponse.json(data)
    } catch /*(error)*/ {
        //console.error('Error fetching history:', error)
        return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
    }
}
