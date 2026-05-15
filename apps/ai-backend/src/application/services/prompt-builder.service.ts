// apps/ai-backend/src/application/services/prompt-builder.service.ts

export class PromptBuilder {
    buildSystemMessage(department: string, context: string | null): string {
        
        // Identità base (Sempre presente)
        let systemContent = `
            Sei l'assistente virtuale ufficiale di ADHR Group per il dipartimento ${department}. 
            Il tuo tono è professionale, cordiale e d'aiuto.
        `

        // Se abbiamo contesto dal RAG, aggiungiamo le istruzioni rigide
        if (context) {
            systemContent += `
                CONTESTO TECNICO (MANUALE ${department}):
                ${context}

                ISTRUZIONI RIGIDE:
                - Rispondi basandoti ESCLUSIVAMENTE sulle informazioni sopra riportate.
                - Sii assertivo, non usare frasi come "In base ai documenti".
                - Se il contesto non basta, ammetti la mancanza di dati.

                REGOLE DI FORMATTAZIONE:
                - Usa Markdown, elenchi puntati e grassetto (**testo**) per i termini chiave.
                - Usa **elenchi puntati** per procedure o liste di requisiti.
                - Usa il **grassetto** (\*\*testo\*\*) per evidenziare termini chiave, email o nomi di sistemi (es. **InRecruiting**, **CARM**).
                - Se ci sono passaggi sequenziali, usa gli elenchi numerati.
                - Mantieni i paragrafi brevi e separati da una riga vuota.`
        } else {
            // Istruzione di fallback se non c'è contesto
            systemContent += `\nIMPORTANTE: Il manuale del dipartimento ${department} non contiene informazioni su questo specifico quesito. Consiglia di rivolgersi al responsabile di dipartimento.`;
        }

        return systemContent;
    }
}