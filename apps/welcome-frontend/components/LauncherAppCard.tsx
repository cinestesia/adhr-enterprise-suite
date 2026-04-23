import Link from 'next/link' // Importa il Link di Next.js
import { AppConfig } from '@/lib/get-launcher-apps'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { ExternalLink } from 'lucide-react'
import { AppStatusBadge } from './AppStatusBadge'

export function LauncherAppCard({ app }: { app: AppConfig }) {
  // Gestiamo il caso in cui l'app sia "Upcoming":
  // forse non vogliamo che sia cliccabile o che porti a una 404
  const isUpcoming = app.status === 'Upcoming'

  return (
    <Link
      href={isUpcoming ? '#' : app.url || '/'}
      className={cn(
        'group relative text-left transition-all hover:scale-[1.02] focus:outline-none block',
        isUpcoming && 'pointer-events-none opacity-80' // Disabilita click se upcoming
      )}
    >
      <Card className="h-full shadow-xl shadow-adhr-zinc-shadow overflow-hidden border-none ring-1 ring-zinc-200 group-hover:ring-primary/30 group-hover:shadow-xl transition-all duration-300 ease-in-out">
        <CardContent className="p-0">
          {' '}
          {/* Rimosso padding default per far toccare la barra ai bordi */}
          <div className="flex p-6 gap-6 items-center">
            {/* ICON BOX */}
            <div
              className={cn(
                'text-white shadow-lg shadow-adhr-zinc-shadow flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl',
                app.color
              )}
            >
              <app.icon className="size-8" />
            </div>

            {/* TEXT CONTENT */}
            <div className="flex-1 pr-8">
              <div className="flex items-center gap-4 mb-1">
                <h3 className="text-xl text-zinc-900 font-medium">{app.title}</h3>
                <AppStatusBadge status={app.status} />
              </div>
            </div>

            {/* ARROW */}
            {!isUpcoming && (
              <div className="absolute top-6 right-6 text-zinc-300 group-hover:text-primary transition-colors">
                <ExternalLink className="size-5" />
              </div>
            )}
          </div>
          {/* BOTTOM BAR HIGHLIGHT */}
          <div className="h-0.5 w-0 bg-adhr-gradient group-hover:w-full transition-all duration-700 ease-in-out" />
        </CardContent>
      </Card>
    </Link>
  )
}
