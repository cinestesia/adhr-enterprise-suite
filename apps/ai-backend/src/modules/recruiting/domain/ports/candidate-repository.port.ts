import { Candidate } from '../models/candidate.model'

export interface ICandidateRepositoryPort {
    save(candidate: Candidate): Promise<{ id: string }>
    // Predisposizione per la ricerca semantica dello Step 2
    findSimilarBySkills(embedding: number[], limit: number): Promise<Candidate[]>
}