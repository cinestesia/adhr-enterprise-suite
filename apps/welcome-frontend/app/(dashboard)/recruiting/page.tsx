// app/(dashboard)/recruiting/page.tsx
'use client'

import { PageHeader } from '@/components/PageHeader'
import { AtsContainer } from '@/features/recruiting/components/AtsContainer'
import { BriefcaseBusiness } from 'lucide-react'

export default function RecruitingPage() {
  return (
    <div className="space-y-6 h-full flex flex-col">
      <PageHeader
        title="Carica cv"
        description="Carica i tuoi curricula in blocco (ZIP o file multipli) ed esegui lo screening semantico assistito dall'IA."
      >
        <div className="p-2 bg-zinc-100 rounded-lg text-zinc-700">
          <BriefcaseBusiness className="size-5" />
        </div>
      </PageHeader>

      {/* Il contenitore principale che gestirà lo stato dell'applicazione ATS */}
      <div className="flex-1 min-h-0">
        <AtsContainer />
      </div>
    </div>
  )
}
