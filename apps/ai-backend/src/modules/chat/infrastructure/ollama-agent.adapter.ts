/**
 * @note
 * Un Agent è un'entità cognitiva, con un obiettivo di business preciso (GOAL),
 * una sua identità ( ROLE ) e un seti di istruzioni ( SYSTEM PROMPT )
 *
 * Creiamo un nuovo agente solo quando cambia radicalmente il contesto aziendale,
 * il livello di autorizzazione o l'obiettivo della conversazione.
 *
 * Agente Sistemi Informativi (quello attuale): Ha accesso al DB transazionale,
 * risponde su metriche e FAQ interne.
 *
 * Agente Recruiter / Selezione: Non deve avere accesso alle query di fatturato,
 * ma deve poter analizzare CV, accedere ai tool dell'ATS e valutare le competenze.
 *
 * Nelle architetture agentiche avanzate, i file .md (Markdown) o descrittivi vengono
 * usati come Skills (o Prompt-as-a-Service). Invece di scrivere codice TypeScript
 * per spiegare all'AI come fare lo screening di un CV, si scrive un file di direttive
 * in linguaggio naturale.
 *
 * L'agente cognitivo ha bisogno di un prompt
 * strettamente legato alla sua natura logica e operativa
 * (le istruzioni per invocare il JSON, il ciclo di pensiero ReAct,
 * l'iniezione dinamica dei JSON Schema dei tool).
 *
 * Ogni agente verticale che creiamo (es. Agente Sistemi Informativi, Agente Recruiter)
 * avrà le proprie istruzioni operative e la sua identità specifica. Mantenere
 * il buildSystemPrompt privato e isolato dentro ciascun adapter dell'agente
 * rispetta l'incapsulamento dell'architettura esagonale:
 * l'agente è un blocco autonomo che sa esattamente come configurare se
 * stesso per funzionare.
 *
 *
 */
import { ChatOpenAI } from '@langchain/openai'

import {
    AgentResponse,
    AgentAction,
    ToolSpecification,
    ToolExecutionContext,
} from '@/modules/shared/domain/models/agent.model'

import { IToolPort } from '@/modules/shared/domain/ports/tool.port'

import {
    AIMessage,
    HumanMessage,
    SystemMessage,
    BaseMessage,
} from '@langchain/core/messages'
import { IAgentPort } from '../domain/ports/agent.port'
import { ChatMessage } from '../domain/models/chat-message.model'

export class OllamaAgentAdapter implements IAgentPort {
    private model: ChatOpenAI
    private readonly maxIterations = 5

    constructor(private liveTools: Map<string, IToolPort>) {
        this.model = new ChatOpenAI({
            openAIApiKey: process.env.OPENAI_API_KEY || 'ollama',
            configuration: {
                baseURL: process.env.AI_BASE_URL || 'http://localhost:11434/v1',
                timeout: 600000,
            },
            model: process.env.AI_MODEL_NAME || 'llama3.1',
            temperature: 0, // Determinismo totale per garantire JSON puliti nei Tool
        })
    }

    async run(
        userMessage: string,
        history: ChatMessage[], // <--- Storia dei messaggi passati dal DB
        context: ToolExecutionContext
    ): Promise<AgentResponse> {
        const actionsExecuted: AgentAction[] = []

        const tools = Array.from(this.liveTools.values()).map(
            (tool) => tool.specification
        )

        /**
         * @esempio
         * [
         *   {
         *       name: 'searchCompanyFaqs',
         *       description: "Utilizza questo strumento esclusivamente quando l'utente fa domande informative su procedure operative, FAQ, manuali tecnici aziendali o dettagli normativi relativi alle piattaforme di ADHR Group (InRecruiting, CARM, ecc.).",
         *       input_schema: { type: 'object', properties: [Object], required: [Array] }
         *   },
         *   {
         *      name: 'queryCorporateDatabase',
         *      description: "Utilizza questo strumento SOLO quando l'utente richiede esplicitamente dati quantitativi vivi, statistiche numeriche, liste di ordini recenti delle filiali, trend di fatturato o conteggi memorizzati nel database aziendale.",
         *      input_schema: { type: 'object', properties: [Object], required: [Array] }
         *   }
         * ]
         *
         */

        // 1. Inseriamo il System Prompt con la definizione dei tool disponibili
        const localHistory: BaseMessage[] = [
            new SystemMessage(this.buildSystemPrompt(tools, context.department)),
        ]
        // 2. Iniettiamo la cronologia passata per dare contesto storico all'agente
        history.forEach((msg) => {
            if (msg.role === 'user') {
                localHistory.push(new HumanMessage(msg.content))
            } else if (msg.role === 'assistant') {
                localHistory.push(new AIMessage(msg.content))
            }
        })

        // 3. Spingiamo l'attuale messaggio inserito dall'utente in chat
        localHistory.push(new HumanMessage(userMessage))

        console.log('localHistory========================>', localHistory)

        let iterations = 0

        while (iterations < this.maxIterations) {
            iterations++
            console.log(
                `[Agent Cognitive Loop] Iterazione ${iterations}/${this.maxIterations}...`
            )

            console.log('AGENTE LOCAL HISTORY: ', localHistory)
            // Chiamiamo Ollama con lo stato della memoria aggiornato
            const response = await this.model.invoke(localHistory)
            const contentText =
                typeof response.content === 'string' ? response.content : ''

            // Controlliamo se Ollama richiede l'attivazione di uno strumento
            const toolCall = this.parseToolCall(contentText)

            if (toolCall) {
                console.log(
                    `[Agent Brain] Ollama richiede il Tool: "${toolCall.toolName}"`
                )

                const currentAction = new AgentAction(
                    toolCall.toolName,
                    toolCall.toolInput
                )
                actionsExecuted.push(currentAction)

                const toolToExecute = this.liveTools.get(toolCall.toolName)
                let toolResult: string

                if (!toolToExecute) {
                    toolResult = `Errore: Il tool "${toolCall.toolName}" non è configurato a sistema.`
                } else {
                    try {
                        // Se toolResult è un oggetto (ritornato dall'adapter), lo stringifichiamo qui
                        const result = await toolToExecute.execute(
                            toolCall.toolInput,
                            context
                        )
                        toolResult =
                            typeof result === 'string'
                                ? result
                                : JSON.stringify(result, null, 2)
                    } catch (error: any) {
                        toolResult = `Errore di esecuzione del tool: ${error.message}`
                    }
                }

                // 🌟 LA CORREZIONE: Estraiamo SOLO il JSON stringificato puro da salvare nella memoria
                // per non inquinare i passaggi successivi con i preamboli parlati del modello.
                const cleanJsonString = JSON.stringify({
                    call_tool: true,
                    toolName: toolCall.toolName,
                    toolInput: toolCall.toolInput,
                })

                localHistory.push(new AIMessage(cleanJsonString)) // <--- Memoria sanificata!
                localHistory.push(
                    new HumanMessage(
                        `[RISULTATO STRUMENTO]: ${toolResult}\nAnalizza questo risultato e decidi se hai concluso il compito o se ti serve un'altra azione.`
                    )
                )

                continue
            }

            // Se non ci sono tool calls, il testo è la risposta finale elaborata
            return new AgentResponse(contentText, actionsExecuted)
        }

        throw new Error(
            `L'agente ha esaurito i passaggi cognitivi utilizzabili (${this.maxIterations}) senza chiudere il loop.`
        )
    }

    private buildSystemPrompt(tools: ToolSpecification[], department: string): string {
        return `
    Sei l'Agente Cognitivo Operativo Ufficiale di ADHR Group per il dipartimento ${department}.
    Il tuo obiettivo è risolvere la richiesta dell'utente analizzando i dati aziendali estratti dai tool. Non inventare mai cifre o fatti.

    STRUMENTI DISPONIBILI (FORMATO JSON SCHEMA):
    ${JSON.stringify(tools, null, 2)}

    REGOLE DECISIONALI SUI CONTROLLI:
    1. Se per rispondere hai bisogno di dati dai manuali o dal database transazionale, DEVI invocare un tool. Rispondi ESCLUSIVAMENTE con un blocco JSON valido, senza aggiungere alcun testo prima o dopo l'oggetto. La struttura deve essere esattamente questa:
    {
        "call_tool": true,
        "toolName": "nome_del_tool",
        "toolInput": { "chiave": "valore" }
    }

    2. Se possiedi già tutti i dati (perché leggi i blocchi [RISULTATO STRUMENTO] scambiati in precedenza), formula la risposta finale in modo chiaro, discorsivo e in linguaggio naturale direttamente per l'utente, SENZA usare la struttura JSON.

    [VETO ASSOLUTO SUI PREAMBOLI E RAGIONAMENTI RESIDUI]
    Quando scrivi la risposta finale all'utente, devi mostrare SOLO ed ESCLUSIVAMENTE la risposta discorsiva finale. 
    Non devi MAI inserire frasi che spiegano i tuoi pensieri o lo stato delle tue informazioni.
    Esempi di frasi VIETATE che NON devi scrivere:
    - "Ho già ottenuto i dati richiesti dall'utente, quindi posso fornire la risposta finale..."
    - "Analizzando il risultato dello strumento, posso concludere che..."
    - "Dato che lo strumento ha risposto con..."

    Inizia direttamente la risposta con il dato o il testo formattato in Markdown.
            `.trim()
    }

    private parseToolCall(
        content: string
    ): { toolName: string; toolInput: Record<string, any> } | null {
        try {
            const jsonStart = content.indexOf('{')
            const jsonEnd = content.lastIndexOf('}')
            if (jsonStart === -1 || jsonEnd === -1) return null

            const jsonString = content.substring(jsonStart, jsonEnd + 1)
            const parsed = JSON.parse(jsonString)

            if (parsed.call_tool === true && parsed.toolName) {
                return {
                    toolName: parsed.toolName,
                    toolInput: parsed.toolInput || {},
                }
            }
        } catch {
            return null
        }
        return null
    }
}
