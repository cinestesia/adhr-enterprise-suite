/**
 * @file zip-processor.ts
 * @description Decompressione client-side di archivi ZIP con sicurezza e progresso.
 * Nessuna dipendenza da React — può essere usato anche in un Web Worker.
 */

import JSZip from 'jszip'
import { isSupportedExtension, isZipEntrySafe, LIMITS } from './validators'

// ─── Tipi pubblici ───────────────────────────────────────────────────────────

export type ZipWarning = {
    fileName: string
    reason: string
}

export type ZipProcessResult = {
    files: File[]
    warnings: ZipWarning[]
    errors: string[]
}

export type ZipProgressCallback = (percent: number) => void

// ─── Implementazione ─────────────────────────────────────────────────────────

/**
 * Estrae da uno ZIP tutti i file con formato supportato.
 * Applica controlli anti-zip-bomb, filtra entry macOS/nascoste
 * e processa le entry in parallelo per massimizzare le performance.
 *
 * @param zipFile    - Oggetto File del browser che rappresenta l'archivio
 * @param onProgress - Callback opzionale invocata con percentuale 0–100
 */
export async function processZipFile(
    zipFile: File,
    onProgress?: ZipProgressCallback
): Promise<ZipProcessResult> {
    const warnings: ZipWarning[] = []
    const errors: string[] = []

    if (zipFile.size > LIMITS.MAX_ZIP_FILE_BYTES) {
        return {
            files: [],
            warnings,
            errors: [`L'archivio ZIP supera il limite di 100 MB.`],
        }
    }

    let zip: JSZip
    try {
        zip = await JSZip.loadAsync(zipFile)
    } catch {
        return {
            files: [],
            warnings,
            errors: [
                'Impossibile leggere il file ZIP. Potrebbe essere danneggiato o cifrato.',
            ],
        }
    }

    // ── Filtraggio entry ────────────────────────────────────────────────────
    const candidateEntries = Object.entries(zip.files).filter(([path, entry]) => {
        if (entry.dir) return false
        if (path.includes('__MACOSX')) return false
        if (path.startsWith('.') || entry.name.startsWith('.')) return false
        if (!isSupportedExtension(entry.name)) return false

        const safetyCheck = isZipEntrySafe(entry)
        if (!safetyCheck.ok) {
            warnings.push({ fileName: entry.name, reason: safetyCheck.reason })
            return false
        }

        return true
    })

    if (candidateEntries.length === 0) {
        return {
            files: [],
            warnings,
            errors: ["Nessun file valido (PDF, DOCX, TXT) trovato nell'archivio."],
        }
    }

    // ── Limite file ─────────────────────────────────────────────────────────
    const limited = candidateEntries.slice(0, LIMITS.MAX_TOTAL_FILES)
    if (candidateEntries.length > LIMITS.MAX_TOTAL_FILES) {
        warnings.push({
            fileName: '',
            reason: `Limite di ${LIMITS.MAX_TOTAL_FILES} file raggiunto. Processati solo i primi ${LIMITS.MAX_TOTAL_FILES}.`,
        })
    }

    // ── Estrazione parallela con progresso ──────────────────────────────────
    let completed = 0
    onProgress?.(0)

    const results = await Promise.all(
        limited.map(async ([, entry]) => {
            const blob = await entry.async('blob')

            // Difesa in profondità: verifica dimensione post-estrazione
            if (blob.size > LIMITS.MAX_FILE_BYTES) {
                warnings.push({
                    fileName: entry.name,
                    reason: `"${entry.name}" supera i 10 MB dopo l'estrazione.`,
                })
                completed++
                onProgress?.(Math.round((completed / limited.length) * 100))
                return null
            }

            completed++
            onProgress?.(Math.round((completed / limited.length) * 100))
            return new File([blob], entry.name, { type: blob.type })
        })
    )

    return {
        files: results.filter((f): f is File => f !== null),
        warnings,
        errors,
    }
}
