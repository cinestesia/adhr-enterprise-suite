import NextAuth from 'next-auth'
import Keycloak from 'next-auth/providers/keycloak'

export const { handlers, signIn, signOut, auth } = NextAuth({
    debug: true,
    providers: [
        Keycloak({
            clientId: process.env.AUTH_KEYCLOAK_ID as string,
            clientSecret: process.env.AUTH_KEYCLOAK_SECRET as string,
            issuer: process.env.AUTH_KEYCLOAK_ISSUER,
        }),
    ],

    callbacks: {
        // invocato ogni volta che viene creato o aggiornato un JWT. Contiene tutte le informazioni
        // è il (Il caveau dei dati grezzi che arrivano da keycloak )
        // Quello che ritorni sarà disponibile in token
        // sync jwt({ session, token, account, profile })  
        async jwt({token, account}) {
            console.log('ACCOUNT', account)
            return token
        },

        // Parti da token qui sopra, e decori ulteriormente per passare auth.user
        async session({ session, token }) {
            // Qui in futuro aggiungerai i ruoli ADHR estratti dal token
            return session
        },
    },

    pages: {
        signIn: '/login', // Forza l'uso dell'endpoint di login
    },
})
