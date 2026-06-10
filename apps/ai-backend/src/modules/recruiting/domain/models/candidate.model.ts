/**
 * @note
 * Rappresenta la struttura dei dati che l'LLM deve obbligatoriamente
 * estrarre dal testo grezzo del Curriculum Vitae.
 */

export interface ExtractedCvData {
    personalData: {
        fullName: string
        email: string | null
        phone: string | null
        location: string | null
    }
    skills: string[]
    experience: Array<{
        role: string
        company: string
        period: string | null
        description: string | null
    }>
    education: Array<{
        degree: string
        institution: string
        year: string | null
    }>
    languages: string[]
}

/**
 * @note
 * Entità di Dominio Candidate.
 * Questa è la struttura ufficiale che viene salvata nel Database aziendale
 * dopo che l'operatore HR ha confermato e validato i dati a schermo.
 */

export class Candidate {
    public readonly id?: string
    public readonly personalData: {
        fullName: string
        email: string | null
        phone: string | null
        location: string | null
    }
    public readonly skills: string[]
    public readonly experience: Array<{
        role: string
        company: string
        period: string | null
        description: string | null
    }>
    public readonly education: Array<{
        degree: string
        institution: string
        year: string | null
    }>
    public readonly languages: string[]
    public readonly cvFileUrl: string
    public readonly createdAt: Date

    constructor(props: {
        id?: string
        personalData: {
            fullName: string
            email: string | null
            phone: string | null
            location: string | null
        }
        skills: string[]
        experience: Array<{
            role: string
            company: string
            period: string | null
            description: string | null
        }>
        education: Array<{
            degree: string
            institution: string
            year: string | null
        }>
        languages: string[]
        cvFileUrl: string
        createdAt?: Date
    }) {
        this.id = props.id
        this.personalData = props.personalData
        this.skills = props.skills || []
        this.experience = props.experience || []
        this.education = props.education || []
        this.languages = props.languages || []
        this.cvFileUrl = props.cvFileUrl
        this.createdAt = props.createdAt || new Date()
    }
}
