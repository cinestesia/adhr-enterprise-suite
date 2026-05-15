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
        /**
         * @note
         * Questa callback gira solo lato server, ogni volta che viene creato o aggiornato un JWT.
         * Decide cosa scrivere dentro il cookie JWE (JSON Web Encryption) che NextAuth salva nel 
         * browser dell'utente.
         * 
         * Il contenuto è criptato. L'utente non può vederlo decriptato nel browser 
         * (se guarda i cookie vedrà solo una stringa illeggibile).
         * 
         * Qui dentro mettiamo tutto ciò che è "pesante" o sensibile e che ci servirà nelle API o nei Server 
         * Components tramite getToken() o auth().
         * 
         * L' accessToken e l' idToken li mettiamo qui. Se non li mettiamo qui, sono persi per sempre 
         * dopo il login.
         * 
         * token: Contiene tutte le informazioni: è Il caveau dei dati grezzi che arrivano da keycloak.
         * 
         * Quello che ritorniamo da questa callback sarà disponibile in token
         * al frontend o al proissimo callback (session).
         * 
         * account e profile: Sono i dati che arrivano da Keycloak al momento del login, sono disponibili solo
         * al primo login, quando viene creato il token.
         * 
         */
        async jwt({ token, account, profile }) {
            // Salva l'id_token nel token Auth.js al primo login ( ho aggiunto il tipo dentro /types )
            if (account && profile) {
                token.idToken = account.id_token // <-- fondamentale per il logout
                token.accessToken = account.access_token // <-- fondamentale per il backend
                token.groups = (profile as any).groups || []
                token.roles = (profile as any).realm_access?.roles || []
            }

            return token
        },

        /**
         * @note
         * Questa funzione decide cosa restituire quando usi gli hook lato client (come useSession) 
         * o la funzione auth() nel frontend.
         * 
         * Prende il token (che arriva dalla callback jwt precedente) e ne seleziona una parte da 
         * passare all'oggetto session.
         * 
         * Tutto quello che mettiamo qui dentro sarà visibile in chiaro nel frontend 
         * (se l'utente apre la console del browser e digita session, vede tutto).
         * 
         * Qui mettiamo solo quello che serve alla tua interfaccia grafica: il nome dell'utente, 
         * i suoi ruoli (per mostrare/nascondere bottoni) o la scadenza della sessione.
         * 
        */
        async session({ session, token }) {
            session.idToken = token.idToken as string 
            session.accessToken = token.accessToken as string
            session.user.groups = token.groups
            session.user.roles = token.roles
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
