import Fastify from 'fastify';
import autoload from '@fastify/autoload';
import path from 'path';
import fastifyEnv from '@fastify/env';
import { EnvSchema } from './schemas/env';

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
                debug: true // Ti aiuterà a vedere se il file viene saltato
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
        //console.log('configuration', (fastify as any).config ); 
        await fastify.listen({ port: 3001, host: '0.0.0.0' });

    } catch (e) {
        fastify.log.error(e);
        process.exit(1);
    }
}

start();
