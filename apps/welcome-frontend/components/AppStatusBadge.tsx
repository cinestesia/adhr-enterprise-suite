import { AppStatus } from '@/lib/get-launcher-apps'
import { Badge } from './ui/badge'

export function AppStatusBadge({ status }: { status: AppStatus }) {
  if (status === 'Upcoming') {
    return (
      <Badge
        variant="coming_soon"
        className="gap-2 px-4 py-2 text-sm font-bold font-geist-mono"
      >
        In arrivo
      </Badge>
    )
  } else if (status === 'Active') {
    return (
      <Badge
        variant="success"
        className="gap-2 px-4 py-2 text-sm font-bold font-geist-mono"
      >
        Attiva
      </Badge>
    )
  }
}
