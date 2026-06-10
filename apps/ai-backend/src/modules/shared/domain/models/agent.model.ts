/**
 * @note
 * Gli LLM moderni sono addestrati nativamente a comprendere il concetto di "Tool"
 * (chiamato spesso Tool Calling o Function Calling). Loro non eseguono fisicamente
 * il codice, ma sanno leggere una descrizione testuale che spiega cosa fa uno
 * strumento e decidere autonomamente che:
 * 
 * "Per rispondere a questa domanda ho bisogno di questo specifico Tool con 
 *  questi specifici parametri".
 * 
 * 
 * 1.   Richiesta utente.
 * 
 * 2.   Analisi & Routing (Chiamata LLM 1): L'app chiede all'LLM di fare Rewrite e decidere la rotta 
 *      (RAG o GENERIC).
 * 
 * 3.   Recupero (Se RAG): L'app interroga il Vector DB usando la query ottimizzata e i filtri, 
 *      ottenendo il contesto.
 * 
 * 4.  Il Ciclo Agentico Principale (Chiamata LLM 2) L'app manda all'LLM:
 *     a. La richiesta riscritta 
 *     b. Il contesto del RAG (se presente) 
 *     c. La cronologia della chat.
 *     d. La lista dei Tool disponibili ( es. prenota_volo, invia_email).
 *    
 * 5.  Bivio Decisore (LLM):
 *    
 *     a. L'LLM ha tutto il necessario => Genera la risposta finale per l'utente (Fine del ciclo).
 *    
 *     b. L'LLM capisce che serve un'azione => Restituisce il nome del Tool e i parametri JSON.
 * 
 * 6.   Esecuzione Tool: L'app esegue il codice del tool, ottiene il risultato e lo rimanda all'LLM con
 *      il ruolo speciale tool.
 * 
 * 7.   Loop o Chiusura ( Chiamata LLM 3...): L'LLM analizza il risultato del tool. Se basta, risponde
 *      all'utente; altrimenti ricomicia.  
 *  
 *     
 */

/**
 * @note
 * Contratto statico richiesto da un LLM qualsiasi per comprendere i parametri di
 * un Tool. Non si tratta di un'entità perchè non ha un suo ciclo di vita o ID unico,
 * non vive come record dentro una delle nostre tabelle. Non è neanche un value object
 * perchè non rappresenta un concetto di business complesso munito di logica come può
 * essere ad esempio un oggetto Address, un Price ecc..
 *
 * Si tratta di un'interfaccia di tipo strutturale ( Data Contracts ) Il suo unico scopo è
 * definire la forma geometrica dei dati che devono essere scambiati tra la nostra
 * app e il mondo esterno ( LLM ).
 *
 *
 */

export type JSONSchemaType =
    | 'string'
    | 'number'
    | 'integer'
    | 'boolean'
    | 'array'
    | 'object'
    | 'null'

export interface JSONSchemaProperty {
    type: JSONSchemaType
    description?: string
    enum?: string[]
    items?: JSONSchemaProperty // per array
    properties?: Record<string, JSONSchemaProperty> // per object annidato
    required?: string[]
}

export interface ToolSpecification {
    name: string
    description: string
    input_schema: {
        // "input_schema" per Anthropic
        type: 'object'
        properties: Record<string, JSONSchemaProperty>
        required?: string[]
    }
}

/**
 * @note
 * Questo è un ValueObject che rappresenta il
 * Contesto di sicurezza di esecuzione del tool.
 *
 */
export class ToolExecutionContext {
    constructor(
        public readonly department: string,
        public readonly userId: string
    ) {
        if (!department || department.trim().length === 0) {
            throw new Error("Il dipartimento è obbligatorio per l'esecuzione del Tool")
        }

        if (!userId || userId.trim().length === 0) {
            throw new Error("L'ID utente è obbligatorio per tracciare l'azione")
        }
    }
}

/**
 * @note
 * Questo è un ValueObject che rappresenta l'azione di chiamata di un Tool decisa
 * dall' LLM
 */

export class AgentAction {
    constructor(
        public readonly toolName: string,
        public readonly toolInput: Record<string, any>
    ) {
        if (!toolName || toolName.trim().length === 0) {
            throw new Error(
                "L'azione dell'agente deve specificare un nome di Tool valido"
            )
        }
    }
}

/**
 * @note
 * Risposta Finale dell'Agente con cronologia d'esecuzione
 */
export class AgentResponse {
    constructor(
        public readonly output: string,
        public readonly actionsExecuted: AgentAction[] = [],
        public readonly createdAt: Date = new Date()
    ) {
        if (!output || output.trim().length === 0) {
            throw new Error("La risposta dell'agente non può essere vuota")
        }
    }

    get hasUsedTools(): boolean {
        return this.actionsExecuted.length > 0
    }
}
