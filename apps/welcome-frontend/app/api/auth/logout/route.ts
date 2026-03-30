import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export const GET = auth(async (req) => {
    const idToken = req.auth?.idToken
    console.log('🔑 idToken dalla route:', idToken)
    console.log('🔑 req.auth completo:', req.auth)
    return NextResponse.json({ idToken })
})
