/**
 * @CATCH_ALL
 * [...nextauth]? (Il Catch-all)
 * Le parentesi quadre con i tre puntini [...] definiscono un Dynamic Catch-all Segment.
 * Significa: "Qualsiasi cosa venga scritta dopo /api/auth/, mandala a questo file".
 * api/auth/signin
 * api/auth/callback
 * api/auth/signout
 * api/auth/session
 *
 * Cosa succede quando richiedi /api/auth/signin/keycloak?
 *
 * L'URL: Il browser chiama http://localhost:3000/api/auth/signin/keycloak.
 *
 * Il Match: Next.js vede che l'URL inizia con /api/auth/. Guarda nella cartella api/auth/ e trova [...nextauth]. Dice: "Ok, questa richiesta è per lui".
 *
 * L'esecuzione: Next.js esegue il file route.ts.
 *
 * Il Passaggio di palla: Poiché nel file abbiamo scritto export const { GET, POST } = handlers, Next.js passa
 * l'intera richiesta agli handlers di Auth.js (quelli che abbiamo importato da auth.ts).
 *
 * Cosa fa Auth.js (dentro gli handlers)?
 * Auth.js guarda la parte finale dell'URL (/signin/keycloak) e ragiona così:
 * Azione: "Ah, l'utente vuole fare signin".
 * Provider: "E vuole usare il provider keycloak".
 * Configurazione: "Fammi vedere in auth.ts come è configurato Keycloak... ok, l'issuer è auth.4.232.3.98.nip.io".
 * Risposta: Invece di mandarti una pagina, gli handlers rispondono al browser con un Redirect (302) verso l'URL
 * di Keycloak, aggiungendo i parametri di sicurezza (client_id, etc.).
 *
 *
 */

// apps/web/app/api/auth/[...nextauth]/route.ts
import { handlers } from '@/auth' // Importiamo gli handler che hai definito nel file auth.ts

// Esportiamo i metodi GET e POST che NextAuth userà per gestire il flusso OIDC
export const { GET, POST } = handlers
