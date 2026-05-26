'use client'

import React, { useState, useRef } from 'react'
import { UploadCloud, FileArchive, Loader2 } from 'lucide-react'
import JSZip from 'jszip'

interface CvDropzoneProps {
  onFilesSelected: (files: File[]) => void
}

export function CvDropzone({ onFilesSelected }: CvDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false)
  const [isUnzipping, setIsUnzipping] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'txt', 'md']

  // Helper per filtrare e verificare se un file è supportato
  const isSupportedFile = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    return ALLOWED_EXTENSIONS.includes(ext || '')
  }

  // Funzione ricorsiva per estrarre i file dallo ZIP client-side
  const processZipFile = async (zipFile: File) => {
    setIsUnzipping(true)
    try {
      const zip = await JSZip.loadAsync(zipFile)
      const extractedFiles: File[] = []

      // Scorriamo tutti i file dentro lo ZIP
      for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
        // Ignoriamo le cartelle interne o i file nascosti del sistema operativo (es. __MACOSX)
        if (
          zipEntry.dir ||
          relativePath.includes('__MACOSX') ||
          relativePath.startsWith('.')
        )
          continue

        if (isSupportedFile(zipEntry.name)) {
          const blob = await zipEntry.async('blob')
          // Creiamo un oggetto File standard dall'entry dello ZIP
          const file = new File([blob], zipEntry.name, { type: blob.type })
          extractedFiles.push(file)
        }
      }

      if (extractedFiles.length > 0) {
        onFilesSelected(extractedFiles)
      } else {
        alert('Nessun file valido (PDF, DOCX, TXT) trovato all’interno dello ZIP.')
      }
    } catch (err) {
      console.error('Errore durante la scompattazione dello ZIP:', err)
      alert('Impossibile leggere il file ZIP. Potrebbe essere danneggiato.')
    } finally {
      setIsUnzipping(false)
    }
  }

  // Gestione dei file filtrati (smista tra ZIP e file singoli)
  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList) return
    const filesArray = Array.from(fileList)

    const zipFiles = filesArray.filter((f) => f.name.endsWith('.zip'))
    const validDirectFiles = filesArray.filter((f) => isSupportedFile(f.name))

    // Se c'è uno ZIP, lo processiamo subito
    if (zipFiles.length > 0) {
      await processZipFile(zipFiles[0])
    }
    // Altrimenti passiamo i file validi caricati direttamente
    else if (validDirectFiles.length > 0) {
      onFilesSelected(validDirectFiles)
    } else {
      alert(
        'Nessun formato supportato inserito. Carica file PDF, DOCX, TXT o un archivio ZIP.'
      )
    }
  }

  // Eventi Drag & Drop standard
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragActive(true)
    else if (e.type === 'dragleave') setIsDragActive(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
    if (e.dataTransfer.files) {
      await handleFiles(e.dataTransfer.files)
    }
  }

  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      className={`flex flex-col items-center justify-center min-h-[420px] border-2 border-dashed rounded-xl p-12 transition text-center select-none ${
        isDragActive
          ? 'border-red-600 bg-red-50/10 text-red-900'
          : 'border-zinc-200 bg-zinc-50/40 text-zinc-500 hover:bg-zinc-50/80 hover:border-zinc-300'
      }`}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        multiple
        accept=".pdf,.docx,.txt,.md,.zip"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {isUnzipping ? (
        <div className="space-y-3 animate-pulse">
          <Loader2 className="size-12 text-red-600 animate-spin mx-auto" />
          <h3 className="font-semibold text-zinc-800 text-lg">
            Estrazione file in corso...
          </h3>
          <p className="text-sm text-zinc-500 max-w-xs">
            Sto decomprimendo l’archivio ZIP direttamente sul tuo browser senza occupare
            la banda del server.
          </p>
        </div>
      ) : (
        <div className="space-y-4 max-w-sm">
          <div className="p-4 bg-white rounded-full shadow-xs inline-flex text-zinc-700 border border-zinc-100 mx-auto">
            <UploadCloud className="size-8 text-zinc-600" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-800 text-base">
              Trascina qui i tuoi Curriculum
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              Rilascia file singoli, seleziona una cartella o trascina direttamente un
              file **archivio .ZIP**.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-xs font-semibold hover:bg-zinc-800 transition shadow-xs"
            >
              Sfoglia File
            </button>

            {/* Trucco HTML5: webkitdirectory permette di selezionare una cartella intera */}
            <button
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.webkitdirectory = true
                  fileInputRef.current.click()
                }
              }}
              className="px-4 py-2 bg-white text-zinc-700 border border-zinc-200 rounded-lg text-xs font-semibold hover:bg-zinc-50 transition shadow-xs"
            >
              Carica Cartella
            </button>
          </div>

          <div className="text-[10px] text-zinc-400 border-t border-zinc-100/80 pt-3 flex items-center justify-center gap-1.5">
            <FileArchive className="size-3.5" /> Estensioni accettate: PDF, DOCX, TXT, ZIP
          </div>
        </div>
      )}
    </div>
  )
}
