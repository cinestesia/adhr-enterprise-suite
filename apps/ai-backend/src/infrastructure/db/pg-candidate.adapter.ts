import { Candidate } from '@/domain/models/candidate.model'
import { ICandidateRepositoryPort } from '@/domain/ports/candidate-repository.port'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { candidates } from './schema'
import { DbInstance } from '.'

export class PgCandidateAdapter implements ICandidateRepositoryPort {
    // Passiamo l'istanza del client Drizzle tramite costruttore (DI)
    constructor(private db: DbInstance) {}

    async save(candidate: Candidate): Promise<{ id: string }> {
        try {
            console.log(
                `[CandidateRepository] Inserimento a DB del candidato: ${candidate.personalData.fullName}`
            )

            const [inserted] = await this.db
                .insert(candidates)
                .values({
                    fullName: candidate.personalData.fullName,
                    email: candidate.personalData.email,
                    phone: candidate.personalData.phone,
                    location: candidate.personalData.location,
                    skills: candidate.skills,
                    experience: candidate.experience,
                    education: candidate.education,
                    languages: candidate.languages,
                    cvFileUrl: candidate.cvFileUrl,
                })
                .returning({ id: candidates.id })

            if (!inserted) {
                throw new Error("Nessun record restituito dopo l'inserimento.")
            }

            return { id: inserted.id }
        } catch (error: any) {
            console.error(
                '[CandidateRepository] Errore durante il salvataggio su Postgres:',
                error.message
            )
            throw error
        }
    }
}
