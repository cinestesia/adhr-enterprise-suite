'use client'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  Bot,
  Briefcase,
  LayoutDashboard,
  Settings,
  Sparkles,
  Plus,
  MessageSquare,
  Loader2,
} from 'lucide-react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useChatSessions } from '@/features/chat/hooks/use-chat-history'

const items = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Chatbot', url: '/ai-agent', icon: Bot },
  { title: 'Recruiting', url: '/recruiting', icon: Briefcase },
  { title: 'Configurazioni', url: '/settings', icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { setOpenMobile, isMobile } = useSidebar()

  const { data: sessions, isLoading } = useChatSessions()

  const handleLinkClick = () => {
    if (isMobile) setOpenMobile(false)
  }
  console.log('SESSONS', sessions)
  return (
    <Sidebar
      className="border-r border-adhr-zinc-light bg-white/50 backdrop-blur-xl backdrop-saturate-150"
      variant="sidebar"
      collapsible="icon"
    >
      <SidebarHeader className="h-16 flex items-center justify-center px-4 transition-all duration-300">
        <div className="flex items-center gap-3 w-full px-2 group-data-[collapsible=icon]:justify-center">
          <div className="size-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(160,4,7,0.4)]" />
          <span className="text-[13px] font-bold tracking-[0.15em] text-zinc-800 uppercase group-data-[collapsible=icon]:hidden">
            ADHR <span className="text-adhr-zinc-light font-light">Hub</span>
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 custom-scrollbar">
        {/* GRUPPO 1: NAVIGAZIONE */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-[0.25em] text-adhr-zinc-medium px-4 mt-6 mb-4 overflow-hidden whitespace-nowrap">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {items.map((item) => {
                const isActive =
                  pathname === item.url ||
                  (item.url !== '/' && pathname.startsWith(item.url))
                return (
                  <SidebarMenuItem key={item.title} onClick={handleLinkClick}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className="transition-all duration-300 py-6 px-4 rounded-xl data-[active=true]:bg-primary/9 data-[active=true]:text-primary hover:bg-adhr-zinc-light/20 group-data-[collapsible=icon]:py-6"
                    >
                      <Link href={item.url} className="flex items-center gap-4">
                        <item.icon
                          className={`size-5 ${isActive ? 'text-primary scale-110' : 'text-adhr-zinc-light'}`}
                          strokeWidth={isActive ? 2.5 : 2}
                        />
                        <span
                          className={`text-[14px] tracking-tight ${isActive ? 'font-bold' : 'font-medium text-adhr-zinc-medium'}`}
                        >
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* GRUPPO 2: AGENTI AI */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-[0.25em] text-adhr-zinc-medium px-4 mt-4 mb-2">
            AI Agents
          </SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton className="py-6 px-4 hover:bg-amber-50/50 group/agent">
                <Sparkles className="text-amber-500 group-hover:animate-pulse" />
                <span className="text-adhr-zinc-medium font-medium">Assistant Hub</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* GRUPPO 3: CRONOLOGIA DINAMICA */}
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-[0.25em] text-adhr-zinc-medium px-4 mt-4 mb-2 flex justify-between items-center">
            Recenti
            <Link href="/ai-agent">
              <Plus className="size-3 cursor-pointer hover:text-primary transition-colors" />
            </Link>
          </SidebarGroupLabel>

          <SidebarMenu>
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="size-4 animate-spin text-zinc-300" />
              </div>
            ) : Array.isArray(sessions) && sessions.length > 0 ? (
              // Se è un array ed è pieno, lo mappiamo
              sessions.map((session: any) => (
                <SidebarMenuItem key={session.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.includes(session.id)}
                    className="py-5 px-4 h-auto"
                  >
                    <Link
                      href={`/ai-agent/${session.id}`}
                      className="flex flex-col items-start gap-0"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <MessageSquare className="size-3 text-zinc-400 shrink-0" />
                        <span className="text-[13px] font-medium truncate w-full italic text-zinc-700">
                          {session.title || 'Conversazione...'}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-400 pl-5">
                        {session.createdAt
                          ? new Date(session.createdAt).toLocaleDateString()
                          : 'Oggi'}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))
            ) : (
              // Stato Vuoto o Errore (se sessions non è un array)
              <div className="px-4 py-3 text-center">
                <p className="text-[11px] text-zinc-400 italic">
                  Nessuna conversazione trovata.
                </p>
              </div>
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 group-data-[collapsible=icon]:items-center">
        <div className="py-3 px-4 rounded-2xl bg-zinc-50 border border-adhr-zinc-ulight group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:border-0">
          <p className="text-[12px] text-adhr-zinc-light font-medium tracking-tight group-data-[collapsible=icon]:hidden text-center">
            © 2026 ADHR Group
          </p>
          <div className="hidden group-data-[collapsible=icon]:block size-1.5 rounded-full bg-zinc-300" />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
