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
        private embeddings: IEmbeddingsPort
    ) {}

    /**
     * @note 
     * Salva un candidato generando in parallelo sia l'embedding olistico del profilo
     * sia l'embedding chirurgico delle competenze tecniche.
     */
    async save(candidate: Candidate): Promise<{ id: string }> {

        const experienceSection = candidate.experience.length > 0
            ? candidate.experience
                .map(exp => {
                    const period = exp.period ? ` (${exp.period})` : '';
                    const desc = exp.description ? `: ${exp.description}` : '';
                    return `- ${exp.role} presso ${exp.company}${period}${desc}`;
                })
                .join('\n')
            : 'Nessuna esperienza professionale registrata';

        // Formattazione pulita e sicura dell'Istruzione
        const educationSection = candidate.education.length > 0
            ? candidate.education
                .map(edu => {
                    const year = edu.year ? ` (${edu.year})` : '';
                    return `- ${edu.degree} presso ${edu.institution}${year}`;
                })
                .join('\n')
            : 'Nessun percorso di studi registrato';

        // Normalizzazione dei campi piatti ed elenchi estratti
        const skillsStr    = candidate.skills.length > 0    ? candidate.skills.join(', ') : 'Non specificate';
        const languagesStr = candidate.languages.length > 0 ? candidate.languages.join(', ') : 'Non specificate';
        const locationStr  = candidate.personalData.location || 'Non specificata';

        /**
         * @note 
         * 
         * (Profile): Cattura l'intera storia aziendale e formativa.
         * Reinforziamo le competenze alla fine per evitare la diluizione semantica (Ancoraggio).
         * 
         * Allineamento a margine a sinistra è utile perchè le stringhe `` preservano tutti gli spazi
         * e i tab di inizio riga
         */ 
        const profileText = `Profilo Candidato: ${candidate.personalData.fullName}
        Località: ${locationStr}
        Competenze principali: ${skillsStr}
        Lingue conosciute: ${languagesStr}

        ESPERIENZE PROFESSIONALI:
        ${experienceSection}

        PERCORSO DI STUDI:
        ${educationSection}

        Sintesi competenze: ${skillsStr}
        `.trim();

        // Testo (Skills): Focalizzato unicamente su competenze tecniche e ruoli ricoperti.
        const skillsText = [
            `Candidato: ${candidate.personalData.fullName}`,
            `Ruoli ricoperti: ${candidate.experience.map(e => e.role).join(', ') || 'Nessuno'}`,
            `Competenze: ${skillsStr}`,
            `Lingue: ${languagesStr}`,
        ].join('\n');

        // Generazione concorrente degli embedding per azzerare il collo di bottiglia di I/O
        let profileEmbeddingArray: number[];
        let skillsEmbeddingArray: number[];

        try {
            [profileEmbeddingArray, skillsEmbeddingArray] = await Promise.all([
                this.embeddings.embedQuery(profileText),
                this.embeddings.embedQuery(skillsText),
            ]);
        } catch (cause) {
            throw new Error(
                `Impossibile generare gli embedding vettoriali per il candidato "${candidate.personalData.fullName}": ${(cause as Error).message}`,
                { cause }
            );
        }

        // Validazione preventiva anti-corruzione degli indici del DB (Ollama / LLM fail-safe)
        const isValidEmbedding = (arr: number[]) => arr && arr.length > 0 && arr.every(v => isFinite(v));

        if (!isValidEmbedding(profileEmbeddingArray)) {
            throw new Error(`profileEmbedding non valido per il candidato "${candidate.personalData.fullName}" (vettore vuoto, NaN o Infinity rilevato)`);
        }
        if (!isValidEmbedding(skillsEmbeddingArray)) {
            throw new Error(`skillsEmbedding non valido per il candidato "${candidate.personalData.fullName}" (vettore vuoto, NaN o Infinity rilevato)`);
        }

        // Helper per il mapping nel formato stringa compatibile con pgvector
        const toVectorLiteral = (arr: number[]) => `[${arr.join(',')}]`;

        // Persistenza atomica tramite Drizzle ORM con binding parametrizzati sicuri
        const dbValues = CandidateMapper.toPersistence(candidate);

        const [inserted] = await this.db
            .insert(candidates)
            .values({
                ...dbValues,
                profileEmbedding: sql`${toVectorLiteral(profileEmbeddingArray)}::vector`,
                skillsEmbedding:  sql`${toVectorLiteral(skillsEmbeddingArray)}::vector`,
            })
            .returning({ id: candidates.id });

        return { id: inserted.id };
    }

    /**
     * Ricerca semantica basata sull'embedding chirurgico delle sole competenze e ruoli (Match Tecnico).
     */
    async findSimilarBySkills(embedding: number[], limit: number = 5): Promise<Candidate[]> {
        const vectorString = `[${embedding.join(',')}]`;
        const similarityScore = sql<number>`1 - (${candidates.skillsEmbedding} <=> ${vectorString}::vector)`.as('similarity');

        const results = await this.db
            .select({
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
            .orderBy(sql`${candidates.skillsEmbedding} <=> ${vectorString}::vector`)
            .limit(limit);

        return results.map(row => CandidateMapper.toDomain(row));
    }

    /**
     * Ricerca semantica basata sull'embedding globale (Background lavorativo, istruzione, attitudini).
     */
    async findSimilarByProfile(embedding: number[], limit: number = 5): Promise<Candidate[]> {
        const vectorString = `[${embedding.join(',')}]`;
        const similarityScore = sql<number>`1 - (${candidates.profileEmbedding} <=> ${vectorString}::vector)`.as('similarity');

        const results = await this.db
            .select({
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
            .orderBy(sql`${candidates.profileEmbedding} <=> ${vectorString}::vector`)
            .limit(limit);

        return results.map(row => CandidateMapper.toDomain(row));
    }
}