import { ICvExtractorPort } from '@/modules/recruiting/domain/ports/cv-extractor.port'
import { ExtractedCvData } from '@/modules/recruiting/domain/models/candidate.model'
import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'

/**
 * @note
 * Un agente come OllamaAgentAdapter ( dentro ./agent ) è progettato per un
 * ciclo di pensiero interattivo. while (iterations < maxIterations) { ... }
 * legge, decide quale tool usare, invoca il tool, analizza il risultato e ricomincia.
 *
 * Qui invece per estrarre i dati da CV non c'è nulla da decidere. Si tratta di
 * un'operazione lineare ( single shot ) come avevamo fatto con predict()
 *
 *
 */

export class OllamaCvExtractorAdapter implements ICvExtractorPort {
    private model: ChatOpenAI

    constructor() {
        this.model = new ChatOpenAI({
            openAIApiKey: process.env.OPENAI_API_KEY || 'ollama',
            configuration: {
                baseURL: process.env.AI_BASE_URL || 'http://localhost:11434/v1',
                timeout: 600000, // 10 minuti
            },
            model: process.env.AI_MODEL_NAME || 'llama3.1',
            temperature: 0, // Puro determinismo, non possiamo inventare dati per un CV
        })
    }

    async extract(cvText: string): Promise<ExtractedCvData> {
        const systemPrompt = `
            Sei l'estrattore semantico ufficiale di ADHR Group specializzato nel mercato del lavoro italiano ed europeo. 
            Il tuo compito è analizzare il testo grezzo di un CV (spesso in formato Europass o standard italiano) e convertirlo in un JSON strutturato.
            Estrai i dati fedelmente, basandoti rigorosamente sul testo fornito. Non inventare informazioni. Se un campo manca, impostalo a null o array vuoto [].

            [REGOLE SPECIFICHE PER COMPETENZE (SKILLS)]
            - Analizza attentamente tutto il testo ed estrai OGNI competenza tecnica, hard skill, soft skill, tool software o metodologia menzionata nel CV.
            - Non limitarti alle prime due o tre: compila un elenco esaustivo di tutte le skill rilevanti identificate.

            [REGOLE SPECIFICHE PER ISTRUZIONE E FORMAZIONE]
            - Includi nella sezione "education" tutti i percorsi scolastici e accademici: Diplomi di scuola superiore, Lauree (Triennali, Magistrali, Vecchio Ordinamento), Master, Dottorati e Corsi di specializzazione rilevanti.
            - "degree": Indica il titolo di studio conseguito (es. "Laurea Magistrale in Economia e Commercio", "Diploma di Perito Informatico").
            - "institution": Indica la scuola, l'università o l'ente di formazione (es. "Università degli Studi di Bologna", "ITIS Fermi").
            - "year": Estrai l'anno di conseguimento o il periodo (es. "2024" o "2018 - 2022"). Se il percorso è in corso, indica "In corso".
            - "grade": Se menzionato, estrai il voto finale (es. "110/110 Lode", "85/100"). Se non presente, imposta a null.

            Rispondi ESCLUSIVAMENTE con un oggetto JSON valido. 
            Non includere blocchi di codice markdown (NO \`\`\`json ... \`\`\`), introduzioni o conclusioni. La tua risposta deve iniziare con '{' e terminare con '}'.

            Ecco la struttura da rispettare rigidamente:
            {
                "personalData": {
                    "fullName": "Nome e Cognome",
                    "email": "stringa o null",
                    "phone": "stringa o null",
                    "location": "Città, Provincia o null"
                },
                "skills": ["Informatica", "Problem Solving", "Gestionale XYZ"],
                "experience": [
                    { 
                        "role": "Qualifica / Ruolo", 
                        "company": "Ragione Sociale Azienda", 
                        "period": "Periodo o null",
                        "description": "Breve riassunto mansioni o null"
                    }
                ],
                "education": [
                    {
                        "degree": "Titolo di studio o Corso",
                        "institution": "Istituto o Università",
                        "year": "Anno o Periodo",
                        "grade": "Votazione o null"
                    }
                ],
                "languages": ["Italiano", "Inglese"]
            }
        `.trim()

        const response = await this.model.invoke([
            new SystemMessage(systemPrompt),
            new HumanMessage(`Testo del CV da analizzare:\n\n${cvText}`),
        ])

        const content = typeof response.content === 'string' ? response.content : ''
        const jsonStart = content.indexOf('{')
        const jsonEnd = content.lastIndexOf('}')

        if (jsonStart === -1 || jsonEnd === -1) {
            throw new Error("L'LLM non ha generato una struttura JSON valida.")
        }

        return JSON.parse(content.substring(jsonStart, jsonEnd + 1)) as ExtractedCvData
    }

    // async extract(cvText: string): Promise<ExtractedCvData> {
    //     const systemPrompt = `
    //         Sei l'estrattore semantico ufficiale di ADHR Group. Il tuo compito è convertire il testo grezzo di un CV in un JSON strutturato.
    //         Estrai i dati fedelmente, senza inventare campi. Se un'informazione manca, impostala a null.

    //         Rispondi ESCLUSIVAMENTE con un oggetto JSON valido avente questa struttura:
    //         {
    //             "personalData": {
    //                 "fullName": "Nome e Cognome",
    //                 "email": "stringa o null",
    //                 "phone": "stringa o null",
    //                 "location": "Città o null"
    //             },
    //             "skills": ["Skill 1", "Skill 2"],
    //             "experience": [
    //                 { "role": "Ruolo", "company": "Azienda", "period": "Periodo" }
    //             ]
    //         }
    //     `.trim()

    //     const response = await this.model.invoke([
    //         new SystemMessage(systemPrompt),
    //         new HumanMessage(`Testo del CV:\n\n${cvText}`)
    //     ])

    //     const content = typeof response.content === 'string' ? response.content : ''
    //     const jsonStart = content.indexOf('{')
    //     const jsonEnd = content.lastIndexOf('}')

    //     if (jsonStart === -1 || jsonEnd === -1) {
    //         throw new Error("L'LLM non ha generato una struttura dati valida.")
    //     }

    //     return JSON.parse(content.substring(jsonStart, jsonEnd + 1)) as ExtractedCvData
    // }
}
