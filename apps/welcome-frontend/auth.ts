import NextAuth from 'next-auth'
import Keycloak from 'next-auth/providers/keycloak'

export const { handlers, signIn, signOut, auth } = NextAuth({
    debug: true,
    providers: [
        Keycloak({
            clientId: process.env.AUTH_KEYCLOAK_ID as string,
            clientSecret: process.env.AUTH_KEYCLOAK_SECRET as string,
            issuer: process.env.AUTH_KEYCLOAK_ISSUER,
            // authorization: {
            //     params: {
            //         scope: "openid profile email phone", // aggiungi qui
            //     }
            // }
        }),
    ],

    callbacks: {
        // invocato ogni volta che viene creato o aggiornato un JWT. Contiene tutte le informazioni
        // è il (Il caveau dei dati grezzi che arrivano da keycloak )
        // Quello che ritorni sarà disponibile in token
        // sync jwt({ session, token, account, profile })
        async jwt({ token, account }) {
            // Salva l'id_token nel token Auth.js al primo login ( ho aggiunto il tipo dentro /types )
            if (account) {
                token.idToken = account.id_token // <-- fondamentale per il logout
            }
            return token
        },

        // Parti da token qui sopra, e decori ulteriormente per passare auth.user
        async session({ session, token }) {
            // Qui in futuro aggiungerai i ruoli ADHR estratti dal token
            session.idToken = token.idToken as string // <-- lo esponi alla sessione
            return session
        },
    },

    events: {
        // Questo viene chiamato quando signOut() viene eseguito lato server
        async signOut(message) {
            // Se hai bisogno di logica server-side al logout
        },
    },
    // Senza pages: Se provi a fare il login, NextAuth ti mostra una pagina grigia standard con un bottone
    // "Sign in with Keycloak".
    pages: {
        signIn: '/login', // Forza l'uso dell'endpoint di login
    },
})
