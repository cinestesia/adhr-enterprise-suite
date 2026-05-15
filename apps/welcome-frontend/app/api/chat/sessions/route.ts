import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function GET(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET })
    if (!token?.accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const backendUrl = process.env.API_BACKEND_URL || 'http://localhost:3002'

    try {
        const res = await fetch(`${backendUrl}/api/v1/chat/sessions`, {
            headers: { 'Authorization': `Bearer ${token.accessToken}` }
        })
        const data = await res.json()
        return NextResponse.json(data)
    } catch (error) {
        return NextResponse.json({ error: 'Backend unreachable' }, { status: 500 })
    }
}