import { OpenAIEmbeddings } from '@langchain/openai'
import { IEmbeddingsPort } from '../../domain/ports/embeddings.port'

export class OllamaEmbeddingsAdapter implements IEmbeddingsPort {
    private embeddings: OpenAIEmbeddings

    constructor() {
        this.embeddings = new OpenAIEmbeddings({
            openAIApiKey: process.env.OPENAI_API_KEY || 'ollama',
            configuration: {
                baseURL: process.env.AI_BASE_URL || 'http://localhost:11434/v1',
            },
            modelName: process.env.AI_EMBEDDING_MODEL_NAME || 'nomic-embed-text',
        })
    }

    async embedDocuments(texts: string[]): Promise<number[][]> {
        return await this.embeddings.embedDocuments(texts)
    }

    async embedQuery(text: string): Promise<number[]> {
        return await this.embeddings.embedQuery(text)
    }
}