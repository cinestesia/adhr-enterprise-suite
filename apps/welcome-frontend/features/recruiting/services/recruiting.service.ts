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
        grade: string | null
    }>
    languages: string[]
}

const BASE_URL = '/api/recruiting'

/**
 * Invia il file alla Route API di Next.js e restituisce la Response grezza
 * per permettere all'hook di consumare il flusso SSE (Server-Sent Events).
 */
export async function extractCvStream(file: File): Promise<Response> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${BASE_URL}/extract`, {
        method: 'POST',
        body: formData,
        // Importante: indichiamo al browser che ci aspettiamo uno stream
        headers: {
            Accept: 'text/event-stream',
        },
    })

    console.log('RESPONSE', response)

    if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || 'Errore durante l’estrazione del CV')
    }

    // Restituiamo l'intera response: l'hook userà response.body.getReader()
    return response
}

/**
 * FASE 2: Confermato e salvato (Invariato, perfetto così)
 */
export async function confirmCandidate(
    data: ExtractedCvData,
    temporaryFileName: string
): Promise<{ candidateId: string }> {
    const response = await fetch(`${BASE_URL}/confirm`, {
        // Nota: aggiustato l'endpoint se il BASE_URL è già /api/recruiting
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...data,
            temporaryFileName,
        }),
    })

    if (!response.ok) {
        throw new Error('Impossibile salvare il candidato nel sistema')
    }

    return response.json()
}
