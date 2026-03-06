import Fastify from 'fastify';
import autoload from '@fastify/autoload';
import path from 'path';
import fastifyEnv from '@fastify/env';
import { EnvSchema } from './schemas/env';

/**
 * @NOTA
 * @fastify/env non legge solo il file .env aggrega le variabili da due fonti:
 * 1. Il file fisico (se specificato e presente).
 * 2. Le variabili d'ambiente già esistenti nel sistema (process.env).
 * 
 * Se i file .env.* non esistono, il plugin cercherà comunque di soddisfare 
 * lo schema utilizzando le variabili d'ambiente del sistema 
 * (quelle che passeresti a Docker con -e o nel file docker-compose.yaml).
 * 
 */


const fastify = Fastify({
    logger: true,
});

const currentEnv = process.env.NODE_ENV || 'development';

async function start() {
    try {
        
        await fastify.register(fastifyEnv, {
            schema: EnvSchema,
            dotenv:{
                path: path.resolve(process.cwd(), `.env.${currentEnv}`), 
                debug: true
            }
        });

        await fastify.register(autoload, {
            dir: path.join(__dirname, 'plugins'),
        });

        // Carica automaticamente le rotte
        await fastify.register(autoload, {
            dir: path.join(__dirname, 'routes'),
        });
        
        
        await fastify.ready(); 
        fastify.printRoutes();
        await fastify.listen({ port: 3001, host: '0.0.0.0' });

    } catch (e) {
        fastify.log.error(e);
        process.exit(1);
    }
}

start();
