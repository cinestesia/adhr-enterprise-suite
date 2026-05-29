/**
 * @file validators.ts
 * @description Regole di validazione per i file CV caricabili.
 * Nessuna dipendenza da React o UI — logica pura e testabile.
 */

// ─── Costanti ────────────────────────────────────────────────────────────────

export const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'txt', 'md'] as const
export type AllowedExtension = (typeof ALLOWED_EXTENSIONS)[number]

export const ALLOWED_MIME_TYPES: Record<AllowedExtension, string[]> = {
  pdf:  ['application/pdf'],
  docx: [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
  ],
  txt: ['text/plain'],
  md:  ['text/plain', 'text/markdown', 'text/x-markdown'],
}

export const LIMITS = {
  MAX_ZIP_FILE_BYTES:       100 * 1024 * 1024, // 100 MB per file ZIP
  MAX_FILE_BYTES:           10 * 1024 * 1024, // 10 MB per file
  MAX_TOTAL_FILES:          100,
  MAX_ZIP_UNCOMPRESSED:     50 * 1024 * 1024, // 50 MB decompressi (anti-zip-bomb)
  MAX_ZIP_COMPRESS_RATIO:   100,              // ratio massimo (anti-zip-bomb)
} as const

// ─── Risultato validazione ───────────────────────────────────────────────────

export type ValidationResult =
  | { ok: true }
  | { ok: false; reason: string }

// ─── Funzioni ────────────────────────────────────────────────────────────────

/**
 * Controlla se l'estensione è supportata.
 */
export function isSupportedExtension(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase()
  return (ALLOWED_EXTENSIONS as readonly string[]).includes(ext ?? '')
}

/**
 * Validazione completa di un File browser:
 * estensione + MIME type + dimensione.
 */
export function validateFile(file: File): ValidationResult {
  const ext = file.name.split('.').pop()?.toLowerCase() as AllowedExtension | undefined

  if (!ext || !(ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) {
    return { ok: false, reason: `"${file.name}": formato non supportato.` }
  }

  if (file.type && file.type !== '') {
    const allowedMimes = ALLOWED_MIME_TYPES[ext] ?? []
    if (!allowedMimes.includes(file.type)) {
      return {
        ok: false,
        reason: `"${file.name}": MIME type non valido (${file.type}).`,
      }
    }
  }

  if (file.size > LIMITS.MAX_FILE_BYTES) {
    return {
      ok: false,
      reason: `"${file.name}" supera il limite di 10 MB.`,
    }
  }

  return { ok: true }
}

/**
 * Controllo anti-zip-bomb su una entry JSZip.
 * Usa i metadati interni esposti da JSZip prima dell'estrazione,
 * così non dobbiamo decomprimere per scoprire che è un attacco.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isZipEntrySafe(zipEntry: any): ValidationResult {
  const internal = zipEntry._data
  if (!internal) return { ok: true } // metadati non disponibili, verifichiamo post-estrazione

  const uncompressed: number = internal.uncompressedSize ?? 0
  const compressed: number   = internal.compressedSize   ?? 1

  if (uncompressed > LIMITS.MAX_ZIP_UNCOMPRESSED) {
    return {
      ok: false,
      reason: `"${zipEntry.name}": file troppo grande dopo la decompressione (${Math.round(uncompressed / 1024 / 1024)} MB).`,
    }
  }

  if (compressed > 0 && uncompressed / compressed > LIMITS.MAX_ZIP_COMPRESS_RATIO) {
    return {
      ok: false,
      reason: `"${zipEntry.name}": ratio di compressione sospetto — possibile zip-bomb.`,
    }
  }

  return { ok: true }
}
