import fp from 'fastify-plugin'
import { FastifyInstance } from 'fastify'

// ─── 1. SHARED / CORE INFRASTRUCTURE ─────────────────────────────────
import { createDbClient } from '@/infrastructure/db'
import { LocalStorageAdapter } from '@/infrastructure/storage/local-storage.adapter'

// ─── 2. FEATURE: KNOWLEDGE INGESTION & RAG ───────────────────────────
import { IngestController } from '@/presentation/http/controllers/ingest.controller'
import { IngestFileUseCase } from '@/application/use-cases/ingest-file.use-case'
import { RagService } from '@/application/services/rag.service'
import { PgVectorAdapter } from '@/infrastructure/ai/pg-vector.adapter'

// ─── 3. FEATURE: RECRUITING & ATS ────────────────────────────────────
import { RecruitingController } from '../controllers/recruiting.controller'
import { ParseCvUseCase } from '@/application/use-cases/parse-cv.use-case'
import { DocumentParserService } from '@/application/services/document-parser.service'
import { OllamaCvExtractorAdapter } from '@/infrastructure/ai/ollama-cv-extractor.adapter'
import { PgCandidateAdapter } from '@/infrastructure/db/pg-candidate.adapter'

// ─── 4. FEATURE: CHAT & AI AGENT SYSTEM ──────────────────────────────
import { ChatController } from '@/presentation/http/controllers/chat.controller'
import { GetChatHistoryUseCase } from '@/application/use-cases/get-chat-history.use-case'
import { GetUserSessionsUseCase } from '@/application/use-cases/get-user-sessions.use-case'
import { SessionService } from '@/application/services/session.service'
import { ChatStreamService } from '@/application/services/chat-stream.service'
import { PromptBuilder } from '@/application/services/prompt-builder.service'
import { QueryAnalyzerService } from '@/application/services/query-analyzer.service'
import { PgChatAdapter } from '@/infrastructure/db/pg-chat.adapter'
import { PgCorporateAdapter } from '@/infrastructure/db/pg-corporate.adapter'
import { OllamaAgentAdapter } from '@/infrastructure/ai/agent/ollama-agent.adapter'
import { SearchFaqsTool } from '@/infrastructure/ai/agent/tools/search-faqs.tool'
import { QueryCorporateDbTool } from '@/infrastructure/ai/agent/tools/query-corporate-db.tool'
import { ITool } from '@/domain/ports/tool.port'
import { OllamaAdapter } from '@/infrastructure/ai/ollama.adapter'
import { ChatUseCase } from '@/application/use-cases/chat.use-case'
import { PinoLoggerAdapter } from '@/infrastructure/logger/pino-logger.adapter'
import { OllamaCvExtractorStreamingAdapter } from '@/infrastructure/ai/ollama-cv-extractor-streaming.adapter'
import { ParseCvStreamingUseCase } from '@/application/use-cases/parse-cv-streaming.use-case'

export const diPlugin = fp(async function diPlugin(fastify: FastifyInstance) {
    // 🟪 1. SHARED / CORE INFRASTRUCTURE
    // ─────────────────────────────────────────────────────────────────
    const dbClient = createDbClient(process.env.DATABASE_URL!)
    const corporateDbClient = createDbClient(process.env.CORPORATE_DATABASE_URL!)
    const storageAdapter = new LocalStorageAdapter()
    const aiAdapter = new OllamaAdapter()

    // 🟦 2. FEATURE: KNOWLEDGE INGESTION & RAG
    // ─────────────────────────────────────────────────────────────────
    const vectorDbAdapter = new PgVectorAdapter(aiAdapter, dbClient)
    const ragService = new RagService(vectorDbAdapter)

    const ingestFileUseCase = new IngestFileUseCase(storageAdapter, vectorDbAdapter)
    const ingestController = new IngestController(ingestFileUseCase)

    // 🟩 3. FEATURE: RECRUITING & ATS
    // ─────────────────────────────────────────────────────────────────
    const documentParser = new DocumentParserService()
    //const cvExtractor = new OllamaCvExtractorAdapter()
    const cvExtractor = new OllamaCvExtractorStreamingAdapter()

    const candidateRepo = new PgCandidateAdapter(dbClient)
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
    const chatRepo = new PgChatAdapter(dbClient)
    const corporateRepo = new PgCorporateAdapter(corporateDbClient)
    const sessionService = new SessionService(chatRepo, aiAdapter)
    const promptBuilder = new PromptBuilder()
    const streamService = new ChatStreamService(chatRepo)
    const queryAnalyzerService = new QueryAnalyzerService(aiAdapter, promptBuilder)

    // Agent Tools Setup
    const searchFaqsTool = new SearchFaqsTool(ragService)
    const queryCorporateDbTool = new QueryCorporateDbTool(corporateRepo)

    const itAgentTools = new Map<string, ITool>([
        [searchFaqsTool.specification.name, searchFaqsTool],
        [queryCorporateDbTool.specification.name, queryCorporateDbTool],
    ])

    const recruitingAgentTools = new Map<string, ITool>([
        [searchFaqsTool.specification.name, searchFaqsTool],
        // [extractCvTool.specification.name, extractCvTool],
    ])

    // Agents Verticali
    const itAgent = new OllamaAgentAdapter(itAgentTools)
    const recruitingAgent = new OllamaAgentAdapter(recruitingAgentTools)

    const agentRegistry = new Map<string, any>([
        ['itAgent', itAgent],
        ['recruitingAgent', recruitingAgent],
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
        queryAnalyzerService
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
