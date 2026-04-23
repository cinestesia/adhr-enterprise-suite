'use client'
import { LauncherAppCard } from '@/components/LauncherAppCard'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { getLauncherApps } from '@/lib/get-launcher-apps'
import { CheckCircle2 } from 'lucide-react'

const APPS = getLauncherApps()

export default function HubPage() {
  const { user } = useAuth()

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* PAGE HEADER */}
      <PageHeader
        className="font-semibold"
        title="ADHR Suite Hub"
        description={
          <>
            Benvenuto, <span className="font-bold">{user?.name}</span>. Seleziona
            un&apos;applicazione per iniziare.
          </>
        }
      >
        {/* Passiamo il badge come "children" */}
        <Badge variant="success" className="gap-2 px-4 py-2 text-sm font-bold">
          <CheckCircle2 className="size-4" />
          Modello locale connesso
        </Badge>
      </PageHeader>

      {/* APP LAUNCHER GRID (Mobile First) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
        {APPS.map((app) => (
          <LauncherAppCard app={app} />
        ))}
      </div>
    </div>
  )
}
