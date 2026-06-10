import { CandidateMapper } from '../mappers/candidate.mapper'
import { IEmbeddingsPort } from '@/modules/shared/domain/ports/embeddings.port'
import { DbInstance } from '@/modules/shared/infrastructure/db'
import { candidates } from '@/modules/shared/infrastructure/db/schema'
import { sql } from 'drizzle-orm'
import { ICandidateRepositoryPort } from '../domain/ports/candidate-repository.port'
import { Candidate } from '../domain/models/candidate.model'

export class PgCandidateRepositoryAdapter implements ICandidateRepositoryPort {
    constructor(
        private db: DbInstance,
        private embeddings: IEmbeddingsPort // ◄ Usiamo lo stesso nome/porta del tuo PgVectorAdapter
    ) {}

    async save(candidate: Candidate): Promise<{ id: string }> {
        // 1. Prepariamo la stringa di testo contestuale da vettorializzare
        const skillTextContext = `Candidato: ${candidate.personalData.fullName}. Competenze: ${candidate.skills.join(', ')}.`
        
        // 2. Generiamo il vettore tramite la porta condivisa
        const embeddingArray = await this.embeddings.embedQuery(skillTextContext)
        const vectorString = `[${embeddingArray.join(',')}]`

        const dbValues = CandidateMapper.toPersistence(candidate)

        // 3. Eseguiamo l'insert tipizzato con Drizzle
        const [inserted] = await this.db
            .insert(candidates)
            .values({
                ...dbValues,
                // Applichiamo lo stesso trucco di cast a vettore che hai usato nel RAG
                skillsEmbedding: sql`${vectorString}::vector`, 
            })
            .returning({ id: candidates.id })

        return { id: inserted.id }
    }

    async findSimilarBySkills(embedding: number[], limit: number = 5): Promise<Candidate[]> {
        const vectorString = `[${embedding.join(',')}]`
        
        // Calcolo della similarità (Cosine Distance invertita)
        const similarityScore = sql<number>`1 - (${candidates.skillsEmbedding} <=> ${vectorString}::vector)`.as('similarity')

        const results = await this.db
            .select({
                // Selezioniamo i campi espliciti o l'intera riga per il mapper
                id: candidates.id,
                fullName: candidates.fullName,
                email: candidates.email,
                phone: candidates.phone,
                location: candidates.location,
                skills: candidates.skills,
                experience: candidates.experience,
                education: candidates.education,
                languages: candidates.languages,
                cvFileUrl: candidates.cvFileUrl,
                createdAt: candidates.createdAt,
                similarity: similarityScore
            })
            .from(candidates)
            // Ordiniamo per distanza vettoriale (<=>)
            .orderBy(sql`${candidates.skillsEmbedding} <=> ${vectorString}::vector`)
            .limit(limit)

        // Mappiamo le righe di Drizzle indietro verso entità pure di Dominio
        return results.map(row => CandidateMapper.toDomain(row))
    }
}