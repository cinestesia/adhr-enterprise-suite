import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 1. Definiamo quali rotte sono "pubbliche" (accessibili a tutti)
const publicRoutes = ['/login', '/register', '/api/public']

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl
  
    // 2. Controlliamo se l'utente ha un "token" di sessione (simulato per ora)
    // Qui in futuro leggerai il cookie di Supabase, Auth.js o del tuo backend
    const isAuthenticated = request.cookies.get('auth-token')

    // 3. LOGICA DELLA GUARDIA
    // Se la rotta NON è pubblica e l'utente NON è loggato -> Vai al Login
    if (!publicRoutes.includes(pathname) && !isAuthenticated) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Se è tutto ok, procedi pure
    return NextResponse.next()
}

// 4. Configurazione: diciamo a Next.js di NON eseguire il middleware su file statici (immagini, icone, etc.)
export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}