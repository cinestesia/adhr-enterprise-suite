'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { useRecruitingBatch } from '../hooks/use-recruiting-batch'
import { CvDropzone } from './CvDropzoneGemini'
import { ExtractedCvData, confirmCandidate } from '../services/recruiting.service'

export interface CandidateFileBatch {
  id: string
  fileName: string
  fileObject: File
  status: 'idle' | 'processing' | 'success' | 'error'
  error?: string
  extractedData?: ExtractedCvData
}

export function AtsContainer() {
  const [batchFiles, setBatchFiles] = useState<CandidateFileBatch[]>([])
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)

  // Cabliamo l'hook custom per gestire la coda concorrente su Ollama
  const { globalProgress, isProcessingBatch } = useRecruitingBatch(
    batchFiles,
    setBatchFiles
  )

  const hasFiles = batchFiles.length > 0
  const currentSelectedFile = batchFiles.find((f) => f.id === selectedFileId)

  // Rileva quando la dropzone estrae i file (singoli, cartelle o ZIP)
  const handleFilesSelected = (files: File[]) => {
    const newItems: CandidateFileBatch[] = files.map((file, index) => ({
      id: `${file.name}-${Date.now()}-${index}`,
      fileName: file.name,
      fileObject: file,
      status: 'idle',
    }))

    setBatchFiles((prev) => [...prev, ...newItems])

    if (!selectedFileId && newItems.length > 0) {
      setSelectedFileId(newItems[0].id)
    }
  }

  // Esegue la Fase 2: Invia i dati modificati/approvati al backend
  const handleConfirmSave = async (updatedData: ExtractedCvData) => {
    if (!currentSelectedFile) return

    try {
      await confirmCandidate(updatedData, currentSelectedFile.fileName)

      // Rimuoviamo il file salvato dalla coda (effetto svuotamento)
      setBatchFiles((prev) => {
        const updated = prev.filter((f) => f.id !== currentSelectedFile.id)
        if (updated.length > 0) {
          setSelectedFileId(updated[0].id)
        } else {
          setSelectedFileId(null)
        }
        return updated
      })
    } catch (err: any) {
      alert(`Errore durante il salvataggio: ${err.message}`)
    }
  }

  // STATO 1: Nessun file -> Mostriamo la Dropzone avanzata
  if (!hasFiles) {
    return <CvDropzone onFilesSelected={handleFilesSelected} />
  }

  // STATO 2: Dashboard di elaborazione e validazione attiva
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-220px)] min-h-[500px]">
      {/* LISTA FILE (A Sinistra) */}
      <Card className="lg:col-span-4 flex flex-col p-4 overflow-hidden border-zinc-200/80 shadow-xs">
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-zinc-900">Avanzamento Screening</h3>
            <span className="text-xs font-bold bg-zinc-100 px-2 py-1 rounded text-zinc-700">
              {globalProgress}%
            </span>
          </div>
          {/* Barra di progresso globale */}
          <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-red-600 h-1.5 transition-all duration-300"
              style={{ width: `${globalProgress}%` }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {batchFiles.map((file) => {
            const isSelected = selectedFileId === file.id
            return (
              <div
                key={file.id}
                onClick={() => setSelectedFileId(file.id)}
                className={`p-3 rounded-lg border text-sm cursor-pointer transition flex items-center justify-between ${
                  isSelected
                    ? 'border-red-600 bg-red-50/20 text-red-900 font-medium'
                    : 'border-zinc-100 hover:bg-zinc-50 text-zinc-700'
                }`}
              >
                <span className="truncate max-w-[180px]">{file.fileName}</span>

                {/* Badge dinamico di stato */}
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    file.status === 'success'
                      ? 'bg-emerald-100 text-emerald-800'
                      : file.status === 'processing'
                        ? 'bg-amber-100 text-amber-800 animate-pulse'
                        : file.status === 'error'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-zinc-100 text-zinc-500'
                  }`}
                >
                  {file.status === 'processing' ? 'AI Parsing...' : file.status}
                </span>
              </div>
            )
          })}
        </div>
      </Card>

      {/* FORM DI REVISIONE DETTAGLIO (A Destra) */}
      <Card className="lg:col-span-8 flex flex-col p-6 overflow-y-auto border-zinc-200/80 shadow-xs">
        {currentSelectedFile ? (
          <div className="space-y-6">
            <div className="border-b border-zinc-100 pb-4">
              <h2 className="text-lg font-bold text-zinc-900">Verifica Dati Semantici</h2>
              <p className="text-xs text-zinc-500">
                File sorgente:{' '}
                <span className="font-mono text-red-600">
                  {currentSelectedFile.fileName}
                </span>
              </p>
            </div>

            {currentSelectedFile.status === 'processing' && (
              <div className="py-12 text-center text-zinc-500 space-y-3">
                <div className="size-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm">
                  Ollama sta analizzando ed estraendo i dati dal CV...
                </p>
              </div>
            )}

            {currentSelectedFile.status === 'error' && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-lg text-rose-900 text-sm">
                <p className="font-semibold">Errore di estrazione AI:</p>
                <p className="text-xs text-rose-700 mt-1">{currentSelectedFile.error}</p>
              </div>
            )}

            {currentSelectedFile.status === 'success' &&
              currentSelectedFile.extractedData && (
                <>
                  {/* Visualizzazione provvisoria prima del form definitivo */}
                  <div className="bg-zinc-50 p-4 rounded-lg font-mono text-xs overflow-x-auto max-h-[300px]">
                    {JSON.stringify(currentSelectedFile.extractedData, null, 2)}
                  </div>

                  <div className="flex justify-end pt-4 border-t border-zinc-100">
                    <button
                      onClick={() =>
                        handleConfirmSave(currentSelectedFile.extractedData!)
                      }
                      className="px-5 py-2.5 bg-red-700 text-white text-sm font-semibold rounded-lg hover:bg-red-800 transition shadow-xs"
                    >
                      Conferma e Salva in ATS
                    </button>
                  </div>
                </>
              )}

            {currentSelectedFile.status === 'idle' && (
              <p className="text-sm text-zinc-400 text-center py-12">
                In coda di elaborazione...
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-zinc-400 text-sm">
            Seleziona un candidato dalla lista di sinistra per avviarne la revisione dei
            dati.
          </div>
        )}
      </Card>
    </div>
  )
}
