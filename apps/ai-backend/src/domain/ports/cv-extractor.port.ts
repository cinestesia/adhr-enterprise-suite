import { ExtractedCvData } from '@/domain/models/candidate.model'

export interface ICvExtractorPort {
    extract(cvText: string): Promise<ExtractedCvData>
}

// per supportare lo streaming
export interface ICvExtractorStreamingPort {
    extractStream(text: string): Promise<AsyncIterable<string>>
}
