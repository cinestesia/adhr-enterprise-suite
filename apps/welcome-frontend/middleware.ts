// apps/welcome-frontend/middleware.ts

import { auth } from '@/auth'
import { NextResponse } from 'next/server'
// console.log("CIAOOO")
export default auth((req) => {
    const { nextUrl } = req
    const isLoggedIn = !!req.auth?.user // NextAuth mette l'utente in req.auth.user

    console.log('USER:', req.auth?.user)
    // Rotte pubbliche
    const publicRoutes = ['/login'] // qui possiamo aggiungere altre pagine pubbliche

    // Se l'utente è loggato e prova ad andare su una pagina pubblica, mandalo in dashboard
    if (isLoggedIn && publicRoutes.includes(nextUrl.pathname)) {
        return NextResponse.redirect(new URL('/', nextUrl))
    }

    // Se l'utente NON è loggato e sta cercando di accedere a pagine non pubbliche
    if (!isLoggedIn && !publicRoutes.includes(nextUrl.pathname)) {
        return NextResponse.redirect(new URL('/login', nextUrl))
    }

    // Altrimenti, procedi normalmente
    return NextResponse.next()
})

/**
 * Intercetta tutte le rotte tranne:
 * API di auth
 * next static / image
 * favicon
 * file statici (.png, .jpg, .jpeg, .svg, .webp, .ico) */
export const config = {
    matcher: [
        '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.webp|.*\\.ico).*)',
    ],
}
