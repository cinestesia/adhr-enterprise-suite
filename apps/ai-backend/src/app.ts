import fastify from 'fastify'
import cors from '@fastify/cors'
import fastifyEnv from '@fastify/env'
import multipart from '@fastify/multipart'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import {
    jsonSchemaTransform,
    serializerCompiler, 
    validatorCompiler,
} from 'fastify-type-provider-zod'

import { diPlugin } from '@/presentation/http/plugins/di.plugin'
import { chatRoutes } from '@/presentation/http/routes/chat.routes'
import { healthRoutes } from '@/presentation/http/routes/health-routes'
import { ingestRoutes } from './presentation/http/routes/ingest.routes'
import { authPlugin } from './presentation/http/plugins/auth.plugin'
import { recruitingRoutes } from './presentation/http/routes/recruiting.routes'

/**
 * @note
 * Di default, Pino scrive i log in un formato JSON compresso
 * e bruttissimo da leggere per un essere umano, ma perfetto
 * per i computer (e per hub di log tipo Azure Kubernetes).
 *
 */
const app = fastify({
    // connectionTimeout: 0,
    // requestTimeout: 0,
    logger: {
        transport:
            process.env.NODE_ENV === 'development'
                ? { target: 'pino-pretty' }
                : undefined,
    },
})

// Definiamo adesso lo schema delle variabili ambientali che l'app DEVE avere per funzionare
const envSchema = {
    type: 'object',
    properties: {
        PORT: { type: 'string', default: '3002' },
        HOST: { type: 'string', default: '0.0.0.0' },
        AI_BASE_URL: { type: 'string' },
        AI_MODEL_NAME: { type: 'string', default: 'llama3.1' },
        AI_EMBEDDING_MODEL_NAME: { type: 'string', default: 'nomic-embed-text' },
        OPENAI_API_KEY: { type: 'string', default: 'not-used' },
        CORS_ORIGIN: { type: 'string', default: '*' },
        DATABASE_URL: { type: 'string' },
    },
}

const options = {
    schema: envSchema,

    dotenv: {
        // true,
        path: `.env.${process.env.NODE_ENV || 'development'}`,
    },
}

const start = async () => {
    try {
        await app.register(fastifyEnv, options)

        app.setValidatorCompiler(validatorCompiler)
        app.setSerializerCompiler(serializerCompiler)
        await app.register(authPlugin)

        await app.register(fastifySwagger, {
            openapi: {
                info: {
                    title: 'ADHR Group - AI Backend API',
                    description:
                        'Documentazione delle API per il sistema AI Interrecruiting/CARM',
                    version: '1.0.0',
                },
                servers: [{ url: `http://localhost:${app.config.PORT}` }],
            },
            transform: jsonSchemaTransform, // La magia che trasforma Zod in Swagger
        })

        await app.register(fastifySwaggerUi, {
            routePrefix: '/docs', // La tua doc sarà qui
            uiConfig: { docExpansion: 'list', deepLinking: false },
        })

        /**
         * @note
         * Registriamo multipart per gestire i file caricati
         * Questo è un middleware parser agganciato al ciclo di vita della richiesta.
         * Di default Fastify sa bene gestire @application/json o text/plain
         * ma se inviamo un form come multipart/form-data astify non saprebbe come leggerlo
         * Registrando questo plugin, istruisci l'app a riconoscere quel Content-Type
         * specifico.
         */
        await app.register(multipart, {
            limits: {
                fileSize: 10 * 1024 * 1024, // Limite 10MB
            },
            attachFieldsToBody: false, // Gestiremo il file manualmente nel controller
        })

        /**
         * @note
         * Qui stiamo aggiungndo un hook, un intercettore nella fase di onRequest
         * che implementa le regole CORS.
         *
         * Quando un browser (es. Chrome o Firefox) cerca di fare una chiamata POST
         * al servizio da un dominio diverso (es. il frontend su localhost:3000 verso
         * il backend su localhost:3002), il browser non invia subito i dati.
         *
         * Prima invia una richiesta di prova chiamata OPTIONS.
         * Senza questo plugin: Fastify risponderebbe con un errore o non saprebbe cosa fare.
         * Con il plugin: Il server risponde automaticamente:
         * "Ehi browser, sono pronto! Accetto chiamate da questo dominio (ORIGIN) e
         * con questi metodi".
         */
        await app.register(cors, {
            origin: app.config.CORS_ORIGIN,
            methods: ['GET', 'POST'],
        })

        // registra il plugin che crea e inietta il controller, use case, adapter)
        await app.register(diPlugin)
        await app.register(healthRoutes) // Omesso il porefix perchè, è solo /health
        await app.register(chatRoutes, { prefix: '/api/v1' })
        await app.register(ingestRoutes, { prefix: '/api/v1' })
        await app.register(recruitingRoutes, { prefix: '/api/v1' })

        const port = Number(app.config.PORT)
        const host = app.config.HOST

        await app.listen({ port, host })
        console.log('Config caricata:', app.config)
        app.log.info(`🚀 ai-backend in ascolto su http://${host}:${port}`)
    } catch (err) {
        app.log.error(err)
        process.exit(1)
    }
}

start()
