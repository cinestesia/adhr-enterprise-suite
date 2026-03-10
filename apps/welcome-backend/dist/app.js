"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const autoload_1 = __importDefault(require("@fastify/autoload"));
const path_1 = __importDefault(require("path"));
const env_1 = __importDefault(require("@fastify/env"));
const env_2 = require("./schemas/env");
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
const fastify = (0, fastify_1.default)({
    logger: true,
});
const currentEnv = process.env.NODE_ENV || 'development';
async function start() {
    try {
        await fastify.register(env_1.default, {
            schema: env_2.EnvSchema,
            dotenv: {
                path: path_1.default.resolve(process.cwd(), `.env.${currentEnv}`),
                debug: true
            }
        });
        await fastify.register(autoload_1.default, {
            dir: path_1.default.join(__dirname, 'plugins'),
        });
        // Carica automaticamente le rotte
        await fastify.register(autoload_1.default, {
            dir: path_1.default.join(__dirname, 'routes'),
        });
        await fastify.ready();
        fastify.printRoutes();
        await fastify.listen({ port: 3001, host: '0.0.0.0' });
    }
    catch (e) {
        fastify.log.error(e);
        process.exit(1);
    }
}
start();
