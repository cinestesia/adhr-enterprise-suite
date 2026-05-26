import { ExtractedCvData } from '@/domain/models/candidate.model'

export interface ICandidateRepositoryPort {
    save(candidate: ExtractedCvData): Promise<{ id: string }>
}
