// infrastructure/adapters/ollama-cv-extractor-streaming.adapter.ts
import { ICvExtractorStreamingPort } from '@/domain/ports/cv-extractor.port'
import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'

/**
 * @note
 * Adattatore per l'estrazione semantica dei CV in modalità streaming.
 * Sfrutta il metodo .stream() di LangChain per inviare i token in tempo reale
 * al BFF, abbattendo i tempi morti di attesa (HTTP 408 Timeout) su CPU.
 */
export class OllamaCvExtractorStreamingAdapter implements ICvExtractorStreamingPort {
    private model: ChatOpenAI

    constructor() {
        this.model = new ChatOpenAI({
            openAIApiKey: process.env.OPENAI_API_KEY || 'ollama',
            configuration: {
                baseURL: process.env.AI_BASE_URL || 'http://localhost:11434/v1',
                timeout: 6000000, // Timeout esteso per l'elaborazione su CPU
            },
            model: process.env.AI_MODEL_NAME || 'llama3.1',
            temperature: 0,
        })
    }

    async extractStream(cvText: string): Promise<AsyncIterable<string>> {
        const systemPrompt = `
            Sei l'estrattore semantico ufficiale di ADHR Group specializzato nel mercato del lavoro italiano ed europeo. 
            Il tuo compito è analizzare il testo grezzo di un CV (spesso in formato Europass o standard italiano) e convertirlo in un JSON strutturato.
            Estrai i dati fedelmente, basandoti rigorosamente sul testo fornito. Non inventare informazioni. Se un campo manca, impostalo a null o array vuoto [].

            [REGOLE SPECIFICHE PER ISTRUZIONE E FORMAZIONE]
            - Includi nella sezione "education" tutti i percorsi scolastici e accademici: Diplomi di scuola superiore, Lauree (Triennali, Magistrali, Vecchio Ordinamento), Master, Dottorati e Corsi di specializzazione rilevanti.
            - "degree": Indica il titolo di studio conseguito (es. "Laurea Magistrale in Economia e Commercio", "Diploma di Perito Informatico").
            - "institution": Indica la scuola, l'università o l'ente di formazione (es. "Università degli Studi di Bologna", "ITIS Fermi").
            - "year": Estrai l'anno di conseguimento o il periodo (es. "2024" o "2018 - 2022"). Se il percorso è in corso, indica "In corso".
            - "grade": Se menzionato, estrai il voto finale (es. "110/110 Lode", "85/100"). Se non presente, imposta a null.

            Rispondi ESCLUSIVAMENTE con un oggetto JSON valido avente questa struttura, senza alcun testo o markdown prima o dopo l'oggetto:
            {
                "personalData": {
                    "fullName": "Nome e Cognome",
                    "email": "stringa o null",
                    "phone": "stringa o null",
                    "location": "Città, Provincia o null"
                },
                "skills": ["Skill 1", "Skill 2"],
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
                "languages": ["Lingua 1", "Lingua 2"]
            }
        `.trim()

        // Avviamo lo streaming nativo di LangChain
        const responseStream = await this.model.stream([
            new SystemMessage(systemPrompt),
            new HumanMessage(`Testo del CV da analizzare:\n\n${cvText}`),
        ])

        // Utilizziamo un generatore asincrono per estrarre la stringa (content)
        // da ogni chunk emesso da LangChain, rispettando l'interfaccia agnostica della porta
        return this.mapToTokenStream(responseStream)
    }

    /**
     * @internal
     * Converte lo stream di nodi/chunk di LangChain in un flusso pulito di sole stringhe (token)
     */
    private async *mapToTokenStream(langchainStream: any): AsyncIterable<string> {
        for await (const chunk of langchainStream) {
            const content = typeof chunk.content === 'string' ? chunk.content : ''
            if (content) {
                yield content
            }
        }
    }
}
