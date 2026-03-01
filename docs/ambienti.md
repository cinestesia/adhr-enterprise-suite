# Ambienti in generale ( node o fastify )

In generale decidiamo in che ambiente vogliamo lavorare e lo comunichiamo tramite NODE_ENV.

Turbo: È solo un "passacarte". Vede che vuoi lanciare un comando e gli passa le variabili che gli hai permesso di passare.

Fastify (@fastify/env): È il "controllore". Prende le variabili che gli arrivano, le valida e, se glielo chiedi, va a leggere i file .env.

# File ambientali
Dentro apps/onboarding-backend/, creo i file necessari. Importante: i nomi devono essere coerenti.

.env.development    => DATABASE_URL=postgres://localhost:5432/dev
.env.test           => DATABASE_URL=postgres://localhost:5432/test
.env.production     => DATABASE_URL=postgres://real-db-server:5432/prod


# Ambienti in next.js
Quando siamo in sviluppo, con il comando:

```json
  "dev": "next dev",
```

Next.js si prodiga per caricare tutte le variabili ambientali che trova nei seguenti file facendone il merge e dando priorità decrescente dal primo all'ultimo ecco cosa fa: 

1. Cerca prima in env.development.local
2. Poi in .env.local (Caricato in tutti gli ambienti tranne test)
3. Poi in .env.development (Solo in pnpm dev)
4. Poi .env (Il valore di default se non trova nulla sopra)

se invece diamo il comando

```json
   "start": "next start",
``` 
La Scala di Priorità in Produzione: 

1. .env.production.local (Il più forte: sovrascrive tutto, ignorato da Git).

2. .env.local (Il jolly: caricato anche qui, ignorato da Git).

3. .env.production (Specifico per la produzione, solitamente pushato su Git).

4. .env (La base).

in questo caso devi prestare attenzione a come vengono lette le variabili. 
Se nel tuo .env.production hai NEXT_PUBLIC_API_URL=https://api.pro.it, quando fai la build, Next.js scrive quell'indirizzo ovunque nel codice JavaScript.
Se dopo la build cambi il file .env.production e lanci next start, il browser continuerà a puntare al vecchio indirizzo! Per aggiornare le variabili NEXT_PUBLIC_ devi rifare la build.

Le variabili senza prefisso (es. DATABASE_URL) vengono invece lette ogni volta che l'app parte o quando una rotta API viene chiamata.

Se cambi DATABASE_URL nel file .env.production e riavvii con next start, l'app userà immediatamente il nuovo database senza bisogno di rifare la build.

analogamente con 
```bash 
next build
```

la scaletta è quella di produzione.
Le variabili NEXT_PUBLIC_ (Iniezione "Hardcoded")
Next.js scansiona tutto il tuo codice del frontend (i componenti React). Ogni volta che trova process.env.NEXT_PUBLIC_API_URL, sostituisce letteralmente quella scritta con il valore trovato nei file .env.

Risultato: Se nel file c'è http://api.prod, nel file .js finale che scaricherà l'utente ci sarà scritto http://api.prod.

Perché? Perché il browser dell'utente non ha accesso ai tuoi file .env o al tuo server; deve avere l'indirizzo già scritto dentro il codice.

B. Le variabili senza prefisso (Referenza "Runtime")
Next.js legge anche queste (es. DATABASE_URL), ma non le scrive nei file del browser per motivi di sicurezza.

Le usa solo se hai del codice che viene eseguito durante la build (ad esempio dentro getStaticProps per andare a prendere i dati dal database e generare le pagine HTML statiche).

Se queste variabili cambiano dopo la build, il server le leggerà aggiornate al prossimo next start, ma il browser non le vedrà mai. 

Però cosa facciamo quando creiamo dei container. Non possiamo copiare i file .env dentro il container con ad esempio il comando:

```Dockerfile
  COPY --from=builder /app/apps/onboarding-frontend/.env.* ./
```
è considerato un bad practice. I file finiranno dentro l'immagine docker. Chiunque abbia accesso al registro delle immagini ( Docker, AWS ECR ecc.. ) può scaricare l'immagine e fare docker history oppure o entrare nel container e leggere le tue password del database o le chiavi API in chiaro. 

Quindi quando buildiamo i container :

1.  Variabili Server: Passale tramite ENV nel comando docker run (Runtime).

2.  Variabili Client (NEXT_PUBLIC_): Passale tramite --build-arg nel comando docker
    build (Build-time).


# .gitignore

Esclude il file locale (quello con i tuoi segreti personali) .env.local
Esclude tutti i file env specifici per ambiente se contengono segreti

.env.development.local
.env.test.local
.env.production.local

Se vuoi essere super sicuro ed escludere TUTTI i file .env 
.env
.env*.local


# .env.example (Questo va su GIT)

API URL per il frontend (necessita del prefisso) iniettate durante il build time
NEXT_PUBLIC_API_URL=

Configurazione Database (solo lato server) passate solo lato server
DATABASE_URL=
DB_PASSWORD=

Chiavi esterne
STRIPE_SECRET_KEY=

# .env.production
NEXT_PUBLIC_API_URL=https://api.onboarding.it
DATABASE_URL=mongodb://user:password@atlas-shard:27017/prod-db
NODE_ENV=production

