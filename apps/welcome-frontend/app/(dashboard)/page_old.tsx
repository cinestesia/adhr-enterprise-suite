'use client'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from 'recharts'
import {
  Users,
  Briefcase,
  FileText,
  Settings,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
// Definizione delle App della Suite
const apps = [
  {
    title: 'AI Agent & Chatbot',
    description: 'AI Agent',
    icon: Users,
    color: 'bg-[#A00407]',
    url: '/ai-agent-and-chatbot',
    status: 'Active',
  },

  {
    title: 'Recruitment App',
    description: 'Gestione candidati, colloqui e pubblicazione annunci.',
    icon: Users,
    color: 'bg-[#A00407]',
    url: '/recruitment',
    status: 'Active',
  },
  {
    title: 'Client Portal',
    description: 'Anagrafica aziende clienti e gestione contratti.',
    icon: Briefcase,
    color: 'bg-zinc-800',
    url: '/clients',
    status: 'Active',
  },
  {
    title: 'Payroll & Admin',
    description: 'Gestione buste paga, presenze e amministrazione.',
    icon: FileText,
    color: 'bg-zinc-600',
    url: '/payroll',
    status: 'Upcoming',
  },
  {
    title: 'System Config',
    description: 'Impostazioni globali, permessi e log di sistema.',
    icon: Settings,
    color: 'bg-zinc-400',
    url: '/settings',
    status: 'Active',
  },
]

// Dati per il grafico di utilizzo globale (Operations per App)
const usageData = [
  { name: 'Recruitment', ops: 4200 },
  { name: 'AI-Agent', ops: 2900 },
  { name: 'Clients', ops: 2800 },
  { name: 'Payroll', ops: 1200 },
  { name: 'Admin', ops: 900 },
]

export default function HubPage() {
  const { user } = useAuth()

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 1. WELCOME SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900">
            ADHR Suite Hub
          </h1>
          <p className="text-zinc-500 font-medium">
            Benvenuto, {user?.name} Seleziona un&apos;applicazione per iniziare.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full border border-emerald-100 shadow-sm w-fit text-sm font-bold">
          <CheckCircle2 className="size-4" />
          Tutti i sistemi sono operativi
        </div>
      </div>

      {/* 2. APP LAUNCHER GRID (Mobile First) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
        {apps.map((app) => (
          <button
            key={app.title}
            className="group relative text-left transition-all hover:scale-[1.02] focus:outline-none"
          >
            <Card className="h-full border-none shadow-lg overflow-hidden ring-1 ring-zinc-200 group-hover:ring-[#A00407]/30 group-hover:shadow-xl transition-all">
              <CardContent className="p-0">
                <div className="flex p-6 gap-6">
                  {/* Icon Box */}
                  <div
                    className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${app.color} text-white shadow-lg`}
                  >
                    <app.icon className="size-8" />
                  </div>

                  {/* Text Content */}
                  <div className="flex-1 pr-8">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-xl text-zinc-900">{app.title}</h3>
                      {app.status === 'Upcoming' && (
                        <span className="text-[10px] bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded uppercase font-black">
                          Presto
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-zinc-500 leading-relaxed font-medium">
                      {app.description}
                    </p>
                  </div>

                  {/* Arrow Decorator */}
                  <div className="absolute top-6 right-6 text-zinc-300 group-hover:text-[#A00407] transition-colors">
                    <ExternalLink className="size-5" />
                  </div>
                </div>

                {/* Bottom Bar highlight */}
                <div className="h-1.5 w-0 bg-adhr-gradient group-hover:w-full transition-all duration-500" />
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      {/* 3. GLOBAL STATS & CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Usage Chart */}
        <Card className="lg:col-span-2 border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Volume Operazioni (Settimanali)</CardTitle>
            <CardDescription>Attività aggregata di tutta la Suite</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={usageData}
                layout="vertical"
                margin={{ left: 30, right: 30 }} // Aggiungiamo margine per non tagliare le barre
              >
                <XAxis type="number" hide />
                {/* Aggiungiamo l'asse Y per vedere i nomi delle App, altrimenti è vuoto */}
                <YAxis
                  dataKey="name"
                  type="category"
                  hide={false}
                  axisLine={false}
                  tickLine={false}
                  width={100}
                  tick={{
                    fill: '#71717a',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                />
                <Tooltip
                  cursor={{ fill: '#f4f4f5' }} // Colore grigio chiarissimo al passaggio del mouse
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                  }}
                />
                <Bar dataKey="ops" radius={[0, 8, 8, 0]} barSize={32}>
                  {usageData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      /* Qui forziamo i colori esadecimali così non dipendiamo dal tema 
                        Il primo è il rosso ADHR, gli altri sono grigi scuri professionali
                      */
                      fill={index === 0 ? '#A00407' : '#27272a'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* System Logs / Quick Stats */}
        <Card className="border-none shadow-sm bg-zinc-900 text-white">
          <CardHeader>
            <CardTitle className="text-lg text-white">System Logs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <div className="text-sm font-medium">Cloud Server: Online</div>
            </div>
            <div className="space-y-3 mt-4">
              <div className="flex justify-between text-xs border-b border-white/10 pb-2">
                <span className="text-zinc-400">Ultimo Login</span>
                <span>Oggi, 09:41</span>
              </div>
              <div className="flex justify-between text-xs border-b border-white/10 pb-2">
                <span className="text-zinc-400">Utenti Attivi</span>
                <span>124</span>
              </div>
              <div className="flex justify-between text-xs border-b border-white/10 pb-2">
                <span className="text-zinc-400">Database Load</span>
                <span>14%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
