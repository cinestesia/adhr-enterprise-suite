'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileText, Layers } from 'lucide-react'
import { CandidateFileBatch } from './AtsContainer'

interface AtsSidebarProps {
  batchFiles: CandidateFileBatch[]
  selectedFileId: string | null
  globalProgress: number
  onSelectFile: (id: string) => void
  getFileStatusLabel: (file: CandidateFileBatch) => string
}

export const AtsSidebar = React.memo(function AtsSidebar({
  batchFiles,
  selectedFileId,
  globalProgress,
  onSelectFile,
  getFileStatusLabel,
}: AtsSidebarProps) {
  return (
    <Card className="lg:col-span-4 flex flex-col p-4 overflow-hidden border-border bg-white shadow-xs h-full min-w-0">
      
      {/* Header Avanzamento Globale */}
      <div className="mb-4 space-y-2 shrink-0 w-full">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-sm text-adhr-zinc-strong uppercase tracking-wider flex items-center gap-2">
            <Layers className="size-4 text-primary" /> Avanzamento Screening
          </h3>
          <span className="text-xs font-mono font-bold bg-zinc-100 px-2 py-0.5 rounded-sm text-adhr-zinc-medium">
            {globalProgress}%
          </span>
        </div>
        <Progress value={globalProgress} variant="default" className="bg-zinc-100" />
      </div>

      {/* Lista File protetta da overflow orizzontale */}
      <ScrollArea className="flex-1 pr-1 w-full container-v-scroll min-h-0">
        <div className="space-y-2 w-full min-w-0">
          {batchFiles.map((file) => {
            const isSelected = selectedFileId === file.id
            const isProcessing = file.status === 'processing'

            return (
              <div
                key={file.id}
                onClick={() => onSelectFile(file.id)}
                className={`p-3 rounded-lg border text-sm cursor-pointer transition-all flex flex-col gap-2 w-full min-w-0 box-border ${
                  isSelected
                    ? 'border-primary bg-zinc-50 text-foreground font-medium shadow-xs'
                    : 'border-zinc-100 hover:bg-zinc-50/50 text-adhr-zinc-medium'
                }`}
              >
                {/* RIGA STRUTTURALE IN CSS GRID: 
                  Forza il primo elemento a occupare il massimo spazio disponibile (1fr)
                  e assegna al badge un'area matematica fissa di 84px.
                */}
                <div className="grid grid-cols-[1fr_84px] items-center gap-2 w-full min-w-0">
                  
                  {/* Blocco Icona + Nome File (Troncamento garantito dal min-w-0 della grid) */}
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className={`size-4 shrink-0 ${isSelected ? 'text-primary' : 'text-zinc-400'}`} />
                    <span className="truncate text-xs block select-none" title={file.fileName}>
                      {file.fileName}
                    </span>
                  </div>

                  {/* Blocco Contenitore Badge (Ancorato a destra, immune a spinte esterne) */}
                  <div className="w-full flex justify-end shrink-0">
                    <Badge
                      variant="outline"
                      className={`text-[9px] font-bold py-0.5 rounded-sm uppercase tracking-wider border-0 block text-center w-full truncate ${
                        file.status === 'success'
                          ? 'bg-success-badge-light text-success-badge-text'
                          : file.status === 'processing'
                            ? 'bg-warning/20 text-warning-foreground animate-pulse'
                            : file.status === 'error'
                              ? 'bg-destructive/10 text-destructive'
                              : 'bg-zinc-100 text-adhr-zinc-light'
                      }`}
                    >
                      {getFileStatusLabel(file)}
                    </Badge>
                  </div>
                </div>

                {/* Micro barra di avanzamento del singolo file (Variante Shadcn 'micro') */}
                {isProcessing && file.fileProgress !== undefined && (
                    <Progress 
                        value={file.fileProgress} 
                        variant="micro" 
                        className="bg-zinc-100/50 w-full"
                        indicatorClassName="bg-warning" // <-- Puoi metterci bg-amber-500, bg-yellow-400, ecc.
                    />
                )}
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </Card>
  )
})