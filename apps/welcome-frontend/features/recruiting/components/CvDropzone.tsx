'use client'

/**
 * @file cv-dropzone.tsx
 * @description Componente UI per il caricamento dei CV.
 *
 * Responsabilità di questo file:
 *  - Rendering della dropzone e dei suoi stati visivi
 *  - Orchestrazione dei moduli di validazione, ZIP e folder-traversal
 *  - Feedback utente tramite sonner toast
 *
 * Logica di business delegata a:
 *  - lib/cv-upload/validators.ts
 *  - lib/cv-upload/zip-processor.ts
 *  - lib/cv-upload/folder-traversal.ts
 */

import React, { useState, useRef, useCallback } from 'react'
import { UploadCloud, FileArchive, Loader2, FolderOpen } from 'lucide-react'
import { toast } from 'sonner'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import { validateFile, LIMITS } from '@/lib/cv-upload/validators'
import { processZipFile } from '@/lib/cv-upload/zip-processor'
import { traverseFileTree } from '@/lib/cv-upload/folder-traversal'

// ─── Tipi ────────────────────────────────────────────────────────────────────

interface CvDropzoneProps {
  onFilesSelected: (files: File[]) => void
}

export function CvDropzone({ onFilesSelected }: CvDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false)
  const [isUnzipping, setIsUnzipping] = useState(false)
  const [unzipProgress, setUnzipProgress] = useState(0)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Helpers di notifica (sonner) ─────────────────────────────────────────

  const notifySuccess = useCallback((message: string) => {
    toast.success(message)
  }, [])

  const notifyError = useCallback((message: string) => {
    toast.error(message)
  }, [])

  const notifyWarning = useCallback((message: string) => {
    toast.warning(message)
  }, [])

  // ── Gestione ZIP ─────────────────────────────────────────────────────────

  const handleZip = useCallback(
    async (zipFile: File) => {
      setIsUnzipping(true)
      setUnzipProgress(0)

      // Per aggiornare la progress bar dell'estrazione dello ZIP
      // fornisco a processZipFile una callback che aggiorna lo stato unzipProgress.
      const result = await processZipFile(zipFile, setUnzipProgress)

      setIsUnzipping(false)
      setUnzipProgress(0)

      result.errors.forEach(notifyError)
      result.warnings.forEach((w) => notifyWarning(w.reason))

      if (result.files.length > 0) {
        onFilesSelected(result.files)
        notifySuccess(`${result.files.length} file estratti con successo.`)
      }
    },
    [notifyError, notifyWarning, notifySuccess, onFilesSelected]
  )

  // ── Gestione file diretti (FileList da input o drop) ─────────────────────

  const handleDirectFiles = useCallback(
    (rawFiles: File[]) => {
      const valid = rawFiles.filter((f) => validateFile(f).ok)
      const invalid = rawFiles.length - valid.length

      if (invalid > 0)
        notifyWarning(`${invalid} file ignorati per formato o dimensione non valida.`)

      const limited = valid.slice(0, LIMITS.MAX_TOTAL_FILES)
      if (valid.length > LIMITS.MAX_TOTAL_FILES) {
        notifyWarning(`Limite di ${LIMITS.MAX_TOTAL_FILES} file raggiunto.`)
      }

      if (limited.length > 0) {
        onFilesSelected(limited)
        notifySuccess(`${limited.length} file caricati.`)
      } else {
        notifyError('Nessun file valido. Usa PDF, DOCX, TXT o un archivio ZIP.')
      }
    },
    [notifyWarning, notifyError, notifySuccess, onFilesSelected]
  )

  // ── Handler input click ───────────────────────────────────────────────────

  const handleInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = e.target.files
      if (!fileList) return

      const files = Array.from(fileList)
      const zipFiles = files.filter((f) => f.name.endsWith('.zip'))
      const rest = files.filter((f) => !f.name.endsWith('.zip'))

      if (zipFiles.length > 0) {
        await handleZip(zipFiles[0])
      } else {
        handleDirectFiles(rest)
      }
    },
    [handleZip, handleDirectFiles]
  )

  // ── Handler drag & drop ───────────────────────────────────────────────────

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(e.type === 'dragenter' || e.type === 'dragover')
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragActive(false)

      const items = e.dataTransfer.items
      if (!items) return

      const directFiles: File[] = []
      const zipFiles: File[] = []

      for (let i = 0; i < items.length; i++) {
        if (directFiles.length >= LIMITS.MAX_TOTAL_FILES) break

        const item = items[i]
        if (item.kind !== 'file') continue
        /**
         * webkitGetAsEntry è supportato solo su Chrome e Edge,
         * ma è l'unico modo affidabile per distinguere se l'utente ha trascinato
         * un singolo file o una cartella.
         */
        const entry = item.webkitGetAsEntry()
        if (!entry) continue

        if (entry.isDirectory) {
          const { files } = await traverseFileTree(entry)
          directFiles.push(...files)
        } else {
          const file = item.getAsFile()
          if (!file) continue
          file.name.endsWith('.zip') ? zipFiles.push(file) : directFiles.push(file)
        }
      }

      if (zipFiles.length > 0) {
        await handleZip(zipFiles[0])
      } else {
        handleDirectFiles(directFiles)
      }
    },
    [handleZip, handleDirectFiles]
  )

  // ── Trigger input ─────────────────────────────────────────────────────────

  const triggerFileSelection = useCallback((asDirectory: boolean) => {
    const input = fileInputRef.current
    if (!input) return
    asDirectory
      ? (input.setAttribute('webkitdirectory', ''), input.setAttribute('directory', ''))
      : (input.removeAttribute('webkitdirectory'), input.removeAttribute('directory'))
    input.value = ''
    input.click()
  }, [])

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      role="region"
      aria-label="Area caricamento curriculum"
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      className={[
        'flex flex-col items-center justify-center min-h-[440px]',
        'border-2 border-dashed rounded-lg p-12',
        'transition-all duration-200 text-center select-none bg-background',
        isDragActive
          ? 'border-primary bg-primary/5 scale-[0.995]'
          : 'border-border hover:bg-muted/30 hover:border-muted-foreground/40',
      ].join(' ')}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        multiple
        accept=".pdf,.docx,.txt,.md,.zip"
        aria-hidden="true"
        onChange={handleInputChange}
      />

      {isUnzipping ? (
        // ── Stato: estrazione ZIP in corso ──────────────────────────────────
        <div className="space-y-4 max-w-sm w-full text-center">
          <Loader2 className="size-10 text-primary animate-spin mx-auto" />
          <p className="font-semibold text-sm text-foreground uppercase tracking-wide">
            Estrazione archivio…
          </p>
          <Progress value={unzipProgress} className="h-1.5" />
          <p className="text-xs text-muted-foreground">
            {unzipProgress}% — I file vengono elaborati localmente nel browser.
          </p>
        </div>
      ) : (
        // ── Stato: idle ─────────────────────────────────────────────────────
        <div className="space-y-6 max-w-md">
          <div className="p-4 bg-muted border border-border rounded-full inline-flex mx-auto">
            <UploadCloud
              className={`size-8 transition-colors duration-200 ${
                isDragActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            />
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-foreground text-base uppercase tracking-wider">
              Trascina i tuoi Curriculum
            </h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
              File singoli, una cartella o un archivio{' '}
              <code className="font-mono text-primary font-bold">.ZIP</code>. Massimo{' '}
              {LIMITS.MAX_TOTAL_FILES} file per sessione.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              size="sm"
              onClick={() => triggerFileSelection(false)}
              className="w-full sm:w-auto uppercase tracking-wider text-xs"
            >
              Sfoglia File
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => triggerFileSelection(true)}
              className="w-full sm:w-auto uppercase tracking-wider text-xs gap-2"
            >
              <FolderOpen className="size-3.5" />
              Carica Cartella
            </Button>
          </div>

          <div className="flex items-center justify-center gap-1.5 border-t border-border pt-4">
            <FileArchive className="size-3.5 text-muted-foreground" />
            {(['PDF', 'DOCX', 'TXT', 'ZIP'] as const).map((ext) => (
              <Badge
                key={ext}
                variant="secondary"
                className="text-[10px] font-mono px-1.5 py-0"
              >
                {ext}
              </Badge>
            ))}
            <span className="text-[10px] text-muted-foreground font-mono ml-1">
              max 10 MB
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
