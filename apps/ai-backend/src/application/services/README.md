# Application Service
Mentre uno use case orchestra uno sccenario applicativo completo, un application service è una logica applicativa riutilizzabile da uno o più casi d'uso.

Un caso d'uso risponde all'intezione di un utente. Cosa vuole fare oggi l'utente? 
attiva il caso d'uso X. Per esempio:

- ChatUseCase
- CreateOrderUseCase
- ResetPasswordUseCase
- GenerateInvoiceUseCase

Quindi in generale possiamo affermare che un caso d'uso rappresenta:

- un workflow applicativo
- un’intenzione business
- un endpoint mentale del sistema

invece un **APPLICATION SERVICE** rappresenta solo una parte del lavoro. Come svolgo una certa parte del lavoro? 

- RagService
- PromptBuilderService
- TokenBudgetService
- SessionAuthorizationService

in pratica essi sono da intendersi come: collaboratori, componenti riusabili, orchestratori secondari. Potrebbero per esempio rientrare in questi services:

1. gestione sessione
2. auth sessione
3. recupero history
4. retrieval RAG
5. filtraggio chunks
6. costruzione prompt
7. generazione titolo
8. streaming
9. persistence

Esempio di caso d'uso ben congegnato: 

```ts


export class ChatUseCase {
    constructor(
        private sessionService: SessionService,
        private ragService: RagService,
        private streamService: ChatStreamService, 
        private promptBuilder: PromptBuilder,
        private chatRepo: IChatRepository,
        private aiGateway: IChatPort
    ) {}

    async execute(dto: ChatRequestDTO): Promise<ChatUseCaseOutput> {
        const { message, user, sessionId: providedId } = dto;

        try {
            const { session, isNew } = await this.sessionService.resolve(providedId, user.id, user.mainDepartment);
            const history = await this.chatRepo.getMessagesBySessionId(session.id, 10);

            if (isNew || history.length === 0) {
                this.sessionService.generateTitleInBackground(session.id, user.id, message);
            }
            await this.chatRepo.saveMessage(session.id, new ChatMessage('user', message));
            const context = await this.ragService.getContext(message, user.mainDepartment);
            const systemContent = this.promptBuilder.buildSystemMessage(user.mainDepartment, context);
            const augmentedHistory = [new ChatMessage('system', systemContent), ...history];
            const rawAiStream = await this.aiGateway.chat(message, augmentedHistory);
            
            return {
                stream: this.streamService.getWrappedStream(rawAiStream, session.id),
                sessionId: session.id
            };

        } catch (error) {
            console.error('[ChatUseCase] Error:', error);
            throw error;
        }
    }
}

``` 