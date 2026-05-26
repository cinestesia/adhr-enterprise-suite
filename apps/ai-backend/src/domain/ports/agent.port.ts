// apps/ai-backend/src/domain/ports/agent.port.ts
import { AgentResponse, ToolExecutionContext } from '../models/agent.model'
import { ChatMessage } from '../models/chat-message.model'

/**
 * Un caso d'uso parla con un IAgentPort per consultare un agente.
 * Il modulo applicativo non sa quali strumenti l'agente possiede internamente,
 * sa solo che gli affida un messaggio, la cronologia e il contesto di esecuzione.
 * Questo garantisce il massimo disaccoppiamento in uno scenario multi-agente.
 */
export interface IAgentPort {
    run(
        userMessage: string,
        history: ChatMessage[],
        context: ToolExecutionContext
    ): Promise<AgentResponse>
}
