'use client'

import React from 'react'
import { Loader2 } from 'lucide-react'

interface AtsLoadingStateProps {
  stage?: 'parsing_file' | 'llm_inference' | 'receiving_data'
  progress: number
}

export function AtsLoadingState({ stage, progress }: AtsLoadingStateProps) {
  return (
    <div className="py-16 text-center space-y-5 max-w-md mx-auto">
      <Loader2 className="size-8 text-primary animate-spin mx-auto" />

      <div className="space-y-1.5">
        <p className="text-sm font-semibold text-adhr-zinc-strong">
          {stage === 'parsing_file' && 'Lettura e Parsing del documento originale...'}
          {stage === 'llm_inference' && "L'Intelligenza Semantica sta analizzando il testo..."}
          {stage === 'receiving_data' && 'Strutturazione dei campi anagrafici e professionali...'}
        </p>
        <p className="text-xs text-adhr-zinc-light">
          {stage === 'llm_inference' && "L'elaborazione su modelli locali ottimizza la privacy ma richiede computazione."}
          {stage === 'parsing_file' && 'Estrazione del testo dal file.'}
        </p>
      </div>

      <div className="inline-flex text-[11px] font-mono font-bold bg-zinc-50 border border-zinc-200 px-2.5 py-1 rounded text-adhr-zinc-medium">
        STAGE PROGRESS: {progress}%
      </div>
    </div>
  )
}