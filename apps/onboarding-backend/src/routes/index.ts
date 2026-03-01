import { FastifyInstance } from 'fastify';
import { RootResponse, RootResponseSchema } from './schema';

export default async function (fastify: FastifyInstance) {
    
    fastify.get<{Reply:RootResponse}>('/', {
        
        schema: {
            response: { 200: RootResponseSchema }
        },
        
        handler: async () => {
            // Chiamata al service (Logica di business)
            return {status:'ok',message: `Onboarding backend ( ${process.env.NODE_ENV} ) is up and running!` };
        }
    });    
}