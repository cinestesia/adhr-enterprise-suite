import { ToolSpecification, ToolExecutionContext } from '@/modules/shared/domain/models/agent.model'
import { IToolPort } from '@/modules/shared/domain/ports/tool.port'

export class ExtractCvDataTool implements IToolPort {
    specification: ToolSpecification = {
        name: 'extractCvData',
        description:
            'Utilizza questo strumento esclusivamente per analizzare il testo o il file di un Curriculum Vitae ed estrarre in modo strutturato informazioni quali: generalità, competenze chiave, esperienze lavorative e livello di istruzione.',
        input_schema: {
            type: 'object',
            properties: {
                cvText: {
                    type: 'string',
                    description:
                        'Il testo grezzo del Curriculum Vitae o il riferimento del file da analizzare.',
                },
            },
            required: ['cvText'],
        },
    }

    async execute(
        input: { cvText: string },
        context: ToolExecutionContext
    ): Promise<any> {
        console.log(
            `[Tool ATS] Estrazione competenze in corso per conto di ${context.userId}...`
        )

        // Mock di un motore di parsing o chiamata a LLM estrattore dedicato
        // In produzione qui integrerai un estrattore PDF o una chiamata mirata
        return {
            status: 'success',
            extractedData: {
                fullName: 'Candidato Esempio',
                topSkills: ['TypeScript', 'Node.js', 'Clean Architecture'],
                experienceYears: 4,
                education: 'Laurea in Informatica',
            },
        }
    }
}
