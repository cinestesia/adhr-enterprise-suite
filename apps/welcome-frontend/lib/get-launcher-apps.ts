import {
    Users,
    Briefcase,
    Settings,
    Bot,
    LucideIcon,
    LayoutDashboard,
} from 'lucide-react'

export type AppStatus = 'Active' | 'Upcoming' | 'Maintenance'

export interface AppConfig {
    readonly title: string
    readonly description: string
    readonly icon: LucideIcon
    readonly color: string
    readonly url: string
    readonly status: AppStatus
}

const APPS_DATA = [
    {
        title: 'Chatbot AI Agent',
        description: 'AI Agent & Chatbot assistenti',
        icon: Bot,
        color: 'bg-[#A00407]',
        url: '/ai-agent',
        status: 'Active',
    },
    {
        title: 'ATS - Applicant Tracking System',
        description: 'Gestione candidati e annunci.',
        icon: Users,
        color: 'bg-[#A00407]',
        url: '/recruitment',
        status: 'Upcoming',
    },
    {
        title: 'Clienti',
        description: 'Gestione clienti e aziende',
        icon: Briefcase,
        color: 'bg-zinc-800',
        url: '/clients',
        status: 'Upcoming',
    },
    {
        title: 'System Config',
        description: 'Impostazioni globali e permessi.',
        icon: Settings,
        color: 'bg-zinc-400',
        url: '/settings',
        status: 'Upcoming',
    },
] as const

/**
 * getLauncherApps() → Prendi tutto.
 * getLauncherApps({ status: 'Active' }) → Prendi solo le attive.
 * getLauncherApps({ includeUrls: ['/ai-agent', '/clients'] }) → Prendi solo questo sotto-insieme (magari per una barra laterale veloce).
 */

interface GetAppsOptions {
    status?: AppStatus
    includeUrls?: string[] // Per chiedere un sotto-insieme specifico
}

export function getLauncherApps(options?: GetAppsOptions): AppConfig[] {
    let apps = [...APPS_DATA] as AppConfig[]

    if (options?.status) {
        apps = apps.filter((app) => app.status === options.status)
    }

    if (options?.includeUrls) {
        apps = apps.filter((app) => options.includeUrls!.includes(app.url))
    }

    return apps
}

export function getRouteMetadata(pathname: string): { title: string; icon?: LucideIcon } {
    // Caso specifico per la dashboard home
    if (pathname === '/') return { title: 'Dashboard', icon: LayoutDashboard }

    // Cerchiamo l'app che corrisponde all'URL
    const app = APPS_DATA.find((a) => pathname.startsWith(a.url))

    return {
        title: app?.title || 'Area Riservata',
        icon: app?.icon,
    }
}
