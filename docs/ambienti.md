# Ambienti in generale ( node o fastify )

In generale decidiamo in che ambiente vogliamo lavorare e lo comunichiamo tramite NODE_ENV.

Turbo: È solo un "passacarte". Vede che vuoi lanciare un comando e gli passa le variabili che gli hai permesso di passare.

Fastify (@fastify/env): È il "controllore". Prende le variabili che gli arrivano, le valida e, se glielo chiedi, va a leggere i file .env.

Tutto questo chiaramente funziona nell'ipotesti che i file ambientali siano presenti dentro la macchina dove gira il servizio, ad esempio fastify. 

Nei casi in cui tale servizio giri dentro un container come docker non è un best practice copiare li dentro i file .env che potrebbero contenere dei dati sensibili. Come si fa allora in questi casi a passare le variabili ambientali. 

In generale quello che accade con le variabili ambientali ad esempio con fastify, è che fastify con dotenv prova a caricare queste variabili da file ambientali in process. 

Quindi l'idea è che le passiamo noi queste variabili al container, durante il running. Ci sono vari modi per farlo, ma di sicuro con docker compose è meglio. 

Ad esempio per il frontend con il seguente docker compose :

 ```yaml
services:
  welcome-frontend:
    build:
      context: .
      dockerfile: apps/welcome-frontend/Dockerfile
      args:
        NODE_ENV: ${NODE_ENV}
        NEXT_PUBLIC_ENVIRONMENT: ${NEXT_PUBLIC_ENVIRONMENT}
        NEXT_PUBLIC_DATABASE_URL: ${NEXT_PUBLIC_DATABASE_URL}
        SERVER_ONLY_VAR: ${SERVER_ONLY_VAR}

    image: welcome-frontend:latest
    container_name: welcome-frontend
    ports:
      - "3000:3000"

    env_file:
      - ./apps/welcome-frontend/${ENV_FILE}

    environment:
      HOSTNAME: 0.0.0.0
      PORT: 3000
``` 
possiamo dare il comando: 

```bash
  docker compose --env-file .env.test up --build
```
oppure: 

```bash 
  docker compose --env-file .env.production up --build
```

i file ambientali quindi non vanno messi ne dentro il repository ne dentro il container. Vanno dunque inseriti anche in .gitignore . Per esempio:

```gitignore

# Esclude il file locale (quello con i tuoi segreti personali) .env.local
# Esclude tutti i file env specifici per ambiente se contengono segreti
.env.development
.env.test
.env.production

#Se vuoi essere super sicuro ed escludere TUTTI i file .env 
#.env
#.env*.local

```
possiamo però nettere nel repository un esempio. Possiamo inserire env.example per indicare quali variabili ambientali passare

```bash
  NODE_ENV= 
  PORT=
  LOG_LEVEL=
  DATABASE_URL=
```

# Come Next gestisce gli ambienti
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

# Nextjs dentro un container docker 
Quando siamo dentro un container docker il best practice è : 

1.  Utilizzare docker compose per passare le variabili ambientali. In questo modo le passiamo al runtime o al 
    build time. Per esempio per passare le variabili ambientali PUBBLICHE cioè che non contengono i secret per inserirle inline ed utilizzarle lato client possiamo passare ad esempio allo step build: 

```bash
  docker compose --env-file apps/welcome-frontend/.env.production build --no-cache welcome-frontend
```
se in docker-compose.yaml abbiamo: 

```yaml
    build:
      context: .
      dockerfile: apps/welcome-frontend/Dockerfile
      args:
        NODE_ENV: ${NODE_ENV}
        NEXT_PUBLIC_NODE_ENV: ${NEXT_PUBLIC_NODE_ENV:-}
        NEXT_PUBLIC_PORT: ${NEXT_PUBLIC_PORT:-}
        NEXT_PUBLIC_DATABASE_URL: ${NEXT_PUBLIC_DATABASE_URL:-}
        NEXT_PUBLIC_LOG_LEVEL: ${NEXT_PUBLIC_LOG_LEVEL:-}
```

=> andrà a passare le variabili nel file .env.production dentro come ARG nel DockerFile nello step build

```Dockerfile
  ARG NEXT_PUBLIC_NODE_ENV
  ARG NEXT_PUBLIC_PORT
  ARG NEXT_PUBLIC_LOG_LEVEL
  ARG NEXT_PUBLIC_DATABASE_URL
```

questi argomenti verranno quindi passati come ENV: 

```DockerFile
  ENV NEXT_PUBLIC_NODE_ENV=${NEXT_PUBLIC_NODE_ENV}
  ENV NEXT_PUBLIC_PORT=${NEXT_PUBLIC_PORT}
  ENV NEXT_PUBLIC_LOG_LEVEL=${NEXT_PUBLIC_LOG_LEVEL}
  ENV NEXT_PUBLIC_DATABASE_URL=${NEXT_PUBLIC_DATABASE_URL}
```

in questo modo saranno disponibili durante il build time e iniettate durante la compilazione dei componenti.  

2. Per le variabili ambientali lato server che possono contenere secret il disocrso è leggermente diverso. Non vogliamo che compaiano da nessuna parte in docker , quindi le passiamo direttamente come variabili ambientali al run time. Quindi diamo il comando:

```bash
  docker compose --env-file apps/welcome-frontend/.env.production up -d welcome-frontend 
```
e se nel docker-compose.yaml abbiamo messo

```yaml
  # Per fare in modo che il compoenente legga i dati al runtime li mettiamo qui 
  environment:
    NODE_ENV: ${NODE_ENV}
    PORT: ${PORT}
    LOG_LEVEL: ${LOG_LEVEL}
    DATABASE_URL: ${DATABASE_URL}
```
verranno passate al docker file come ambiente direttamente senza fare nulla a livello di DockerFile. Quindi in sintesi e ricapitolando: 

1. Variabili Client-Side (NEXT_PUBLIC_*) - Build Time
Il tuo approccio è corretto. Poiché queste variabili vengono iniettate nel codice statico, devono essere presenti quando esegui npm run build dentro il Dockerfile.

Il flusso: .env file → Docker Compose (args) → Dockerfile (ARG) → Dockerfile (ENV) → Next Build.

Perché è corretto: Senza il passaggio finale ENV NEXT_PUBLIC_...=${NEXT_PUBLIC_...} nel Dockerfile, il processo di build di Next.js non vedrebbe le variabili definite come ARG.

2. Variabili Server-Side (Secret) - Runtime
Anche qui, la logica è impeccabile. Le variabili server-side (senza prefisso public) vengono lette da Node.js a runtime.

Il flusso: .env file → Docker Compose (environment) → Container OS.

Perché è corretto: Non c'è bisogno di dichiararle nel Dockerfile. Questo rende l'immagine Docker portabile: puoi usare la stessa immagine in stage e in production cambiando solo le variabili d'ambiente al momento del lancio (up).