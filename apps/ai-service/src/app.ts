// apps/ai-service/src/app.ts
import fastify from 'fastify'
import cors from '@fastify/cors'
import fastifyEnv from '@fastify/env'
import { diPlugin } from './plugins/di.plugin'
import { chatRoutes } from '@/interfaces/http/routes/chat.routes'

/**
 * @note
 * Di default, Pino scrive i log in un formato JSON compresso e bruttissimo da leggere per un essere umano,
 * ma perfetto per i computer (e per i raccoglitori di log di Azure Kubernetes).
 *
 */
const app = fastify({
    logger: {
        transport:
            process.env.NODE_ENV === 'development'
                ? { target: 'pino-pretty' }
                : undefined,
    },
})

// Definiamo lo schema delle variabili ambientali che l'app DEVE avere per funzionare
const schema = {
    type: 'object',
    required: ['AI_BASE_URL', 'AI_MODEL_NAME'],
    properties: {
        PORT: { type: 'string', default: '3002' },
        HOST: { type: 'string', default: '0.0.0.0' },
        AI_BASE_URL: { type: 'string' },
        AI_MODEL_NAME: { type: 'string', default: 'gpt-4' },
        CORS_ORIGIN: { type: 'string', default: '*' },
    },
}

const options = {
    schema: schema,

    dotenv: {
        // true,  => Dice al plugin di leggere comunque il file .env se esiste (utile in locale)
        path: `.env.${process.env.NODE_ENV || 'development'}`,
    },
}

const start = async () => {
    try {
        await app.register(fastifyEnv, options)

        await app.register(cors, {
            origin: app.config.CORS_ORIGIN, // Usiamo la variabile tipizzata!
            methods: ['GET', 'POST'],
        })

        await app.register(diPlugin)
        await app.register(chatRoutes, { prefix: '/api/v1' })

        // Accediamo alle variabili tramite app.config (popolato dal plugin)
        const port = Number(app.config.PORT)
        const host = app.config.HOST

        await app.listen({ port, host })

        app.log.info(`🚀 AI Service in ascolto su http://${host}:${port}`)
    } catch (err) {
        app.log.error(err)
        process.exit(1)
    }
}

start()

/**
 * @note
 * Vede che dotenv: true è attivo.
 *
 * qui sopra fastify:
 *
 * 1.   Cerca un file chiamato .env nella cartella in cui stai eseguendo l'app.
 * 2.   Se lo trova, prende quelle variabili e le carica temporaneamente in process.env.
 * 3.   Subito dopo, le prende, le valida contro il tuo schema JSON (quello con type: 'object'),
 *      applica i valori di default se qualcosa manca, e infine le sposta dentro l'oggetto app.config.
 *
 * Se il file non esiste, non succede nulla di grave. Il plugin semplicemente non caricherà nulla da file,
 * ma andrà a leggere direttamente le variabili d'ambiente reali del sistema operativo
 * (quelle iniettate da Docker o da Kubernetes).
 *
 * Ecco il comportamento preciso del plugin:
 * Cerca il file .env. Non lo trova? Ok, pazienza, va avanti.
 * Guarda le variabili d'ambiente che Kubernetes ha iniettato nel container (accessibili tramite process.env).
 * Applica lo schema di validazione su quelle variabili.
 * Se le variabili ci sono e sono corrette: L'app parte e le trovi in app.config.
 * Se manca una variabile obbligatoria (es. AI_BASE_URL): L'app va in crash immediatamente all'avvio con un errore chiaro, impedendo di deployare un container rotto.
 * In pratica: il file .env lo usiamo solo come "comodità" per non dover digitare le variabili a mano sul PC.
 * Su Kubernetes non metteremo nessun file .env: passeremo le variabili direttamente nello YAML del cluster
 * e @fastify/env le leggerà da lì!
 *
 *
 */
