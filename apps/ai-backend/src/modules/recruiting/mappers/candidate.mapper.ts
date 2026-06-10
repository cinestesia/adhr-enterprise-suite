import { Candidate } from "../domain/models/candidate.model"

export class CandidateMapper {
    static toDomain(raw: any): Candidate {
        return new Candidate({
            id: raw.id,
            personalData: {
                fullName: raw.fullName, // Mappato sul camelCase di Drizzle
                email: raw.email,
                phone: raw.phone,
                location: raw.location,
            },
            skills: raw.skills || [],
            experience: raw.experience || [],
            education: raw.education || [],
            languages: raw.languages || [],
            cvFileUrl: raw.cvFileUrl,
            createdAt: raw.createdAt,
        })
    }

    static toPersistence(domain: Candidate) {
        return {
            id: domain.id,
            fullName: domain.personalData.fullName,
            email: domain.personalData.email,
            phone: domain.personalData.phone,
            location: domain.personalData.location,
            skills: domain.skills,        // Passato come array nativo (Drizzle fa il bind JSONB)
            experience: domain.experience,
            education: domain.education,
            languages: domain.languages,
            cvFileUrl: domain.cvFileUrl,
            createdAt: domain.createdAt,
        }
    }
}