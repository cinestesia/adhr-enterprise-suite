'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { useRecruitingBatch } from '../hooks/use-recruiting-batch'
import { CvDropzone } from './CvDropzone'
import { ExtractedCvData, confirmCandidate } from '../services/recruiting.service'
import { CvReviewForm } from './CvReviewForm'
import { AtsSidebar } from './AtsSidebar'
import { FileText, Loader2, AlertCircle } from 'lucide-react'
import { AtsLoadingState } from './AtsLoadingState'

export interface CandidateFileBatch {
  id: string
  fileName: string
  fileObject: File
  status: 'idle' | 'processing' | 'success' | 'error'
  stage?: 'parsing_file' | 'llm_inference' | 'receiving_data'
  fileProgress?: number
  error?: string
  extractedData?: ExtractedCvData
}

export function AtsContainer() {
  const [batchFiles, setBatchFiles] = useState<CandidateFileBatch[]>([])
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)

  const { globalProgress } = useRecruitingBatch(batchFiles, setBatchFiles)

  const currentSelectedFile = useMemo(() => 
    batchFiles.find((f) => f.id === selectedFileId),
    [batchFiles, selectedFileId]
  )

  const handleFilesSelected = useCallback((files: File[]) => {
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
  }, [selectedFileId])

  const handleConfirmSave = useCallback(async (updatedData: ExtractedCvData) => {
    if (!currentSelectedFile) return

    try {
      await confirmCandidate(updatedData, currentSelectedFile.fileName)
      setBatchFiles((prev) => {
        const updated = prev.filter((f) => f.id !== currentSelectedFile.id)
        setSelectedFileId(updated.length > 0 ? updated[0].id : null)
        return updated
      })
    } catch (err: any) {
      alert(`Errore durante il salvataggio: ${err.message}`)
    }
  }, [currentSelectedFile])

  const getFileStatusLabel = useCallback((file: CandidateFileBatch) => {
    if (file.status === 'idle') return 'In coda...'
    if (file.status === 'success') return 'Pronto'
    if (file.status === 'error') return 'Errore AI'
    if (file.stage === 'parsing_file') return 'Lettura...'
    if (file.stage === 'llm_inference') return 'Elaborazione AI...'
    if (file.stage === 'receiving_data') return 'Scrittura JSON...'
    return 'AI Parsing...'
  }, [])

  if (batchFiles.length === 0) {
    return <CvDropzone onFilesSelected={handleFilesSelected} />
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-220px)] min-h-[500px]">
      
      {/* SIDEBAR SINISTRA CON RIEPILOGO CV E STATISTICHE */}
      <AtsSidebar 
        batchFiles={batchFiles}
        selectedFileId={selectedFileId}
        globalProgress={globalProgress}
        onSelectFile={setSelectedFileId}
        getFileStatusLabel={getFileStatusLabel}
      />

      {/* DETTAGLIO REVISIONE DESTRA */}
      <Card className="lg:col-span-8 flex flex-col p-6 overflow-y-auto border-border bg-white shadow-xs">
        {currentSelectedFile ? (
          <div className="space-y-6">
            <div className="border-b border-zinc-100 pb-4">
              <h2 className="text-base font-bold text-adhr-zinc-strong uppercase tracking-wider">Verifica Dati Semantici</h2>
              <p className="text-xs text-adhr-zinc-light mt-1">
                File sorgente: <span className="font-mono text-primary font-medium">{currentSelectedFile.fileName}</span>
              </p>
            </div>

            {/* Stati di rendering isolati */}
            {currentSelectedFile.status === 'processing' && (
              <AtsLoadingState stage={currentSelectedFile.stage} progress={currentSelectedFile.fileProgress || 0} />
            )}

            {currentSelectedFile.status === 'error' && (
              <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg text-destructive text-sm flex gap-3 items-start">
                <AlertCircle className="size-5 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Estrazione non riuscita</p>
                  <p className="text-xs opacity-90">{currentSelectedFile.error}</p>
                </div>
              </div>
            )}

            {currentSelectedFile.status === 'success' && currentSelectedFile.extractedData && (
              <CvReviewForm data={currentSelectedFile.extractedData} onSave={handleConfirmSave} />
            )}

            {currentSelectedFile.status === 'idle' && (
              <div className="py-16 text-center space-y-2">
                <Loader2 className="size-5 text-adhr-zinc-light animate-spin mx-auto opacity-40" />
                <p className="text-xs text-adhr-zinc-light italic">In coda di pianificazione...</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-adhr-zinc-light text-xs gap-2">
            <FileText className="size-8 opacity-30 stroke-[1.5]" />
            Seleziona un candidato dalla lista di sinistra per analizzarne i dettagli.
          </div>
        )}
      </Card>
    </div>
  )
}