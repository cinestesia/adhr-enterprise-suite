import fp from 'fastify-plugin'
import { FastifyInstance } from 'fastify'

// ─── 1. SHARED / CORE INFRASTRUCTURE ─────────────────────────────────
import { LocalStorageAdapter } from '@/modules/shared/infrastructure/storage/local-storage.adapter'

// ─── 2. FEATURE: KNOWLEDGE INGESTION & RAG ───────────────────────────
import { IngestController } from '@/presentation/http/controllers/ingest.controller'
import { IngestFileUseCase } from '@/modules/shared/application/use-cases/ingest-file.use-case'
import { RagService } from '@/modules/chat/application/services/rag.service'
import { PgRagKnowledgeBaseAdapter } from '@/modules/shared/infrastructure/ai/pg-rag-knowledge-base.adapter'

// ─── 3. FEATURE: RECRUITING & ATS ────────────────────────────────────
import { RecruitingController } from '../controllers/recruiting.controller'

// ─── 4. FEATURE: CHAT & AI AGENT SYSTEM ──────────────────────────────
import { ChatController } from '@/presentation/http/controllers/chat.controller'
import { GetChatHistoryUseCase } from '@/modules/chat/application/use-cases/get-chat-history.use-case'
import { GetUserSessionsUseCase } from '@/modules/chat/application/use-cases/get-user-sessions.use-case'
import { SessionService } from '@/modules/chat/application/services/session.service'
import { ChatStreamService } from '@/modules/chat/application/services/chat-stream.service'
import { PromptBuilder } from '@/modules/chat/application/services/prompt-builder.service'
import { QueryAnalyzerService } from '@/modules/chat/application/services/query-analyzer.service'
import { PgCorporateAdapter } from '@/modules/shared/infrastructure/db/pg-corporate.adapter'
import { OllamaAgentAdapter } from '@/modules/chat/infrastructure/ollama-agent.adapter'
import { SearchFaqsTool } from '@/modules/chat/infrastructure/tools/search-faqs.tool'
import { QueryCorporateDbTool } from '@/modules/chat/infrastructure/tools/query-corporate-db.tool'
import { IToolPort } from '@/modules/shared/domain/ports/tool.port'
import { ChatUseCase } from '@/modules/chat/application/use-cases/chat.use-case'
import { PinoLoggerAdapter } from '@/modules/shared/infrastructure/logger/pino-logger.adapter'
import { OllamaCvExtractorStreamingAdapter } from '@/modules/recruiting/infrastructure/ollama-cv-extractor-streaming.adapter'
import { createDbClient } from '@/modules/shared/infrastructure/db'
import { ParseCvStreamingUseCase } from '@/modules/recruiting/application/use-cases/parse-cv-streaming.use-case'
import { LocalDocumentParserAdapter } from '@/modules/shared/infrastructure/parsers/local-document-parser.adapter'
import { OllamaAiGatewayAdapter } from '@/modules/chat/infrastructure/ollama-ai-gateway.adapter'
import { PgCandidateRepositoryAdapter } from '@/modules/recruiting/infrastructure/pg-candidate-repository.adapter'
import { PgChatRepositoryAdapter } from '@/modules/chat/infrastructure/pg-chat-repository.adapter'
import { OllamaEmbeddingsAdapter } from '@/modules/shared/infrastructure/ai/ollama-embeddings.adapter'
import { IAgentPort } from '@/modules/chat/domain/ports/agent.port'

export const diPlugin = fp(async function diPlugin(fastify: FastifyInstance) {
    // 🟪 1. SHARED / CORE INFRASTRUCTURE
    // ─────────────────────────────────────────────────────────────────
    const dbClient = createDbClient(process.env.DATABASE_URL!)
    const corporateDbClient = createDbClient(process.env.CORPORATE_DATABASE_URL!)
    const storageAdapter = new LocalStorageAdapter()
    const aiAdapter = new OllamaAiGatewayAdapter()
    const embeddingsAdapter = new OllamaEmbeddingsAdapter()

    // 🟦 2. FEATURE: KNOWLEDGE INGESTION & RAG
    // ─────────────────────────────────────────────────────────────────
    const knowledgeBaseAdapter = new PgRagKnowledgeBaseAdapter(
        embeddingsAdapter,
        dbClient
    )
    const ragService = new RagService(knowledgeBaseAdapter)
    const ingestFileUseCase = new IngestFileUseCase(storageAdapter, knowledgeBaseAdapter)
    const ingestController = new IngestController(ingestFileUseCase)

    // 🟩 3. FEATURE: RECRUITING & ATS
    // ─────────────────────────────────────────────────────────────────
    const documentParser = new LocalDocumentParserAdapter()
    //const cvExtractor = new OllamaCvExtractorAdapter()
    const cvExtractor = new OllamaCvExtractorStreamingAdapter()

    const candidateRepo = new PgCandidateRepositoryAdapter(dbClient, embeddingsAdapter)
    const loggerAdapter = new PinoLoggerAdapter(fastify.log)

    // const parseCvUseCase = new ParseCvUseCase(cvExtractor, candidateRepo, storageAdapter, documentParser,loggerAdapter )

    const parseCvUseCase = new ParseCvStreamingUseCase(
        cvExtractor,
        candidateRepo,
        storageAdapter,
        documentParser,
        loggerAdapter
    )

    const recruitingController = new RecruitingController(parseCvUseCase)

    // 🟧 4. FEATURE: CHAT & AI AGENT SYSTEM
    // ─────────────────────────────────────────────────────────────────
    // Repositories & Servizi Core della Chat
    const chatRepo = new PgChatRepositoryAdapter(dbClient)
    const corporateRepo = new PgCorporateAdapter(corporateDbClient)
    const sessionService = new SessionService(chatRepo, aiAdapter)
    const promptBuilder = new PromptBuilder()
    const streamService = new ChatStreamService(chatRepo)
    const queryAnalyzerService = new QueryAnalyzerService(aiAdapter, promptBuilder)

    // Agent Tools Setup
    const searchFaqsTool = new SearchFaqsTool(ragService)

    const queryCorporateDbTool = new QueryCorporateDbTool(corporateRepo)

    const itAgentTools = new Map<string, IToolPort>([
        [searchFaqsTool.specification.name, searchFaqsTool],
        [queryCorporateDbTool.specification.name, queryCorporateDbTool],
    ])

    // const recruitingAgentTools = new Map<string, IToolPort>([
    //     [searchFaqsTool.specification.name, searchFaqsTool],
    //     // [extractCvTool.specification.name, extractCvTool],
    // ])

    // Agents Verticali
    const itAgent = new OllamaAgentAdapter(itAgentTools)

    //const recruitingAgent = new OllamaAgentAdapter(recruitingAgentTools)

    const agentRegistry = new Map<string, IAgentPort>([
        ['itAgent', itAgent],
        // ['recruitingAgent', recruitingAgent],
    ])

    // Use Cases & Controller Chat
    const chatUseCase = new ChatUseCase(
        sessionService,
        ragService,
        streamService,
        promptBuilder,
        chatRepo,
        aiAdapter,
        agentRegistry,
        queryAnalyzerService,
        loggerAdapter
    )
    const getChatHistoryUseCase = new GetChatHistoryUseCase(chatRepo)
    const getUserSessionsUseCase = new GetUserSessionsUseCase(chatRepo)

    const chatController = new ChatController(
        chatUseCase,
        getChatHistoryUseCase,
        getUserSessionsUseCase
    )

    // 🚀 FASTIFY DECORATORS REGISTRATION
    // ─────────────────────────────────────────────────────────────────
    fastify.decorate('chatController', chatController)
    fastify.decorate('ingestController', ingestController)
    fastify.decorate('recruitingController', recruitingController)
})

declare module 'fastify' {
    interface FastifyInstance {
        chatController: ChatController
        ingestController: IngestController // Aggiunto (mancava nel tipo originale)
        recruitingController: RecruitingController // Aggiunto (mancava nel tipo originale)
    }
}
