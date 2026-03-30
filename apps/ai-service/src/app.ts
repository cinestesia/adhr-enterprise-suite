import Fastify from 'fastify'
import { ChatOpenAI } from '@langchain/openai'

interface ChatBody {
    message: string
}

const fastify = Fastify({ logger: true })

/**
 * Questo modello va bene anche per LocalAI che utilizza la medesima interfiaccia
 * di OpenAI
 */
const model = new ChatOpenAI({
    // LocalAI non controlla la chiave, ma LangChain la richiede come stringa non vuota
    openAIApiKey: 'sk-no-key-required',

    /**
     * In Kubernetes, l'URL interno (FQDN) segue lo schema:
     * nome-service.namespace.svc.cluster.local.
     */
    configuration: {
        baseURL: 'http://localai-service.development.svc.cluster.local/v1',
    },

    // Nome del modello definito nel tuo YAML di LocalAI
    modelName: 'gpt-4',

    // Parametri opzionali per evitare timeout in locale
    temperature: 0.7,
})

/**
 * sonde kubernetes: sono utilizzate per readiness e liveness.
 */
fastify.get('/ai/health', async () => {
    return { status: 'alive' }
})

fastify.get('/ai/ready', async () => {
    return { status: 'ready' }
})

// Rotta per la chat
fastify.post('/ai/chat', async (request, reply) => {
    const { message } = request.body as ChatBody

    try {
        // Invoke restituisce un BaseMessage, il contenuto è in .content
        const response = await model.invoke(message)
        return { response: response.content }
    } catch (error) {
        fastify.log.error(error)
        return reply
            .status(500)
            .send({ error: 'Errore durante la comunicazione con LocalAI' })
    }
})

const start = async () => {
    try {
        await fastify.listen({ port: 3002, host: '0.0.0.0' })
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}

start()
