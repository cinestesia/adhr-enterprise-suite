/**
 * @file folder-traversal.ts
 * @description Scansione ricorsiva di cartelle tramite la HTML5 FileSystem API
 * (webkitGetAsEntry / FileSystemDirectoryEntry).
 * Nessuna dipendenza da React.
 */

import { validateFile, LIMITS } from './validators'

// ─── Tipi pubblici ───────────────────────────────────────────────────────────

export type TraversalResult = {
  files:    File[]
  skipped:  number   // file ignorati per formato o dimensione
}

// ─── Implementazione ─────────────────────────────────────────────────────────

/**
 * Legge ricorsivamente una directory tramite la FileSystem API.
 *
 * @note  readEntries() della spec restituisce al massimo 100 entry per chiamata.
 *        Il loop do/while garantisce che vengano letti tutti i batch.
 *
 * @param entry      - FileSystemEntry radice (file o cartella)
 * @param accumulator - Stato accumulato della traversal (uso interno)
 */
export async function traverseFileTree(
  entry:       FileSystemEntry,
  accumulator: TraversalResult = { files: [], skipped: 0 },
): Promise<TraversalResult> {
  if (accumulator.files.length >= LIMITS.MAX_TOTAL_FILES) return accumulator

  if (entry.isFile) {
    const file = await getFile(entry as FileSystemFileEntry)
    const validation = validateFile(file)

    if (validation.ok) {
      accumulator.files.push(file)
    } else {
      accumulator.skipped++
    }

  } else if (entry.isDirectory) {
    const dirEntry  = entry as FileSystemDirectoryEntry
    const dirReader = dirEntry.createReader()

    // Legge tutti i batch (readEntries è limitata a ~100 item per chiamata)
    let batch: FileSystemEntry[]
    do {
      batch = await readEntries(dirReader)
      for (const innerEntry of batch) {
        if (accumulator.files.length >= LIMITS.MAX_TOTAL_FILES) break
        await traverseFileTree(innerEntry, accumulator)
      }
    } while (batch.length > 0 && accumulator.files.length < LIMITS.MAX_TOTAL_FILES)
  }

  return accumulator
}

// ─── Helpers privati ─────────────────────────────────────────────────────────

function getFile(entry: FileSystemFileEntry): Promise<File> {
  return new Promise((resolve, reject) => entry.file(resolve, reject))
}

function readEntries(reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
  return new Promise((resolve, reject) => reader.readEntries(resolve, reject))
}
