'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { useRecruitingBatch } from '../hooks/use-recruiting-batch'
import { CvDropzone } from './CvDropzone'
import { ExtractedCvData, confirmCandidate } from '../services/recruiting.service'
import { CvReviewForm } from './CvReviewForm'

// Estendiamo il tipo per tracciare lo stato granulare dello stream SSE
export interface CandidateFileBatch {
  id: string
  fileName: string
  fileObject: File
  status: 'idle' | 'processing' | 'success' | 'error'
  stage?: 'parsing_pdf' | 'ollama_inference' | 'receiving_data' // 🌟 Micro-stati SSE
  fileProgress?: number // 🌟 Progresso sul singolo file (0-100)
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
      fileProgress: 0,
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

  // Helper per calcolare l'etichetta testuale dello stato del file
  const getFileStatusLabel = (file: CandidateFileBatch) => {
    if (file.status === 'idle') return 'In coda...'
    if (file.status === 'success') return 'Pronto'
    if (file.status === 'error') return 'Errore AI'

    // Se è in processing, guardiamo lo stage SSE
    if (file.stage === 'parsing_pdf') return 'Lettura PDF...'
    if (file.stage === 'ollama_inference') return 'Elaborazione AI...'
    if (file.stage === 'receiving_data') return 'Scrittura JSON...'
    return 'AI Parsing...'
  }

  if (!hasFiles) {
    return <CvDropzone onFilesSelected={handleFilesSelected} />
  }

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
            const isProcessing = file.status === 'processing'

            return (
              <div
                key={file.id}
                onClick={() => setSelectedFileId(file.id)}
                className={`p-3 rounded-lg border text-sm cursor-pointer transition flex flex-col gap-2 relative overflow-hidden ${
                  isSelected
                    ? 'border-red-600 bg-red-50/20 text-red-900 font-medium'
                    : 'border-zinc-100 hover:bg-zinc-50 text-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between z-10 w-full">
                  <span className="truncate max-w-[180px]">{file.fileName}</span>

                  {/* Badge dinamico con i nuovi micro-stati parlanti */}
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
                    {getFileStatusLabel(file)}
                  </span>
                </div>

                {/* 🌟 Mini barra di progresso fluida sulla card del singolo file */}
                {isProcessing && file.fileProgress !== undefined && (
                  <div className="w-full bg-zinc-100/50 h-1 rounded-full overflow-hidden mt-1">
                    <div
                      className="bg-amber-500 h-1 transition-all duration-500 ease-out"
                      style={{ width: `${file.fileProgress}%` }}
                    />
                  </div>
                )}
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

            {/* Schermata di caricamento dinamica con feedback in tempo reale */}
            {currentSelectedFile.status === 'processing' && (
              <div className="py-12 text-center text-zinc-500 space-y-4 max-w-md mx-auto">
                <div className="size-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />

                <div className="space-y-1">
                  <p className="text-sm font-semibold text-zinc-800">
                    {currentSelectedFile.stage === 'parsing_pdf' &&
                      'Lettura e Parsing del documento originale...'}
                    {currentSelectedFile.stage === 'ollama_inference' &&
                      "L'Intelligenza Semantica (Ollama) sta analizzando il testo..."}
                    {currentSelectedFile.stage === 'receiving_data' &&
                      'Strutturazione dei campi anagrafici e professionali...'}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {currentSelectedFile.stage === 'ollama_inference' &&
                      "L'elaborazione su CPU può richiedere fino a un minuto per file."}
                    {currentSelectedFile.stage === 'parsing_pdf' &&
                      'Estrazione dei layer testuali grezzi dal PDF.'}
                  </p>
                </div>

                {/* Percentuale numerica fluida del singolo file */}
                <div className="text-xs font-mono text-zinc-400">
                  Avanzamento elaborazione file: {currentSelectedFile.fileProgress || 0}%
                </div>
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
                  <CvReviewForm 
                    data={currentSelectedFile.extractedData} 
                    onSave={handleConfirmSave} 
                  />

                  <div className="flex justify-end pt-4 border-t border-zinc-100">
     
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
