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
} from './ui/sidebar'
import { Bot, Briefcase, LayoutDashboard, Settings, ChevronLeft } from 'lucide-react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

const items = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Chatbot', url: '/ai-agent', icon: Bot },
  { title: 'Gestione Clienti', url: '/clients', icon: Briefcase },
  { title: 'Configurazioni', url: '/settings', icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { setOpenMobile, isMobile } = useSidebar() // 2. Estraiamo le funzioni

  // Funzione per chiudere dopo il click (solo su mobile)
  const handleLinkClick = () => {
    if (isMobile) setOpenMobile(false)
  }

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

      <SidebarContent className="px-2">
        <SidebarGroup>
          {/* Label Navigazione: Più piccola, più spaziata, molto "tech" */}
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
                      className={`
                                                transition-all duration-300 py-6 px-4 rounded-xl
                                                /* Stato Attivo: Sfondo ultra-light e bordo sinistro accennato */
                                                data-[active=true]:bg-primary/9 
                                                data-[active=true]:text-primary
                                                hover:bg-adhr-zinc-light/20 
                                                group-data-[collapsible=icon]:py-6
                                            `}
                    >
                      <Link href={item.url} className="flex items-center gap-4">
                        <item.icon
                          className={`size-5 transition-transform duration-300 ${isActive ? 'text-primary scale-120' : 'text-adhr-zinc-light'}`}
                          strokeWidth={isActive ? 2.5 : 2}
                        />
                        <span
                          className={`text-[14px] tracking-tight transition-all ${isActive ? 'font-bold' : 'font-medium text-adhr-zinc-medium'}`}
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
      </SidebarContent>

      {/* FOOTER: Per dare un senso di chiusura e stabilità */}
      <SidebarFooter className="p-4 group-data-[collapsible=icon]:items-center">
        <div className="py-3 px-4 rounded-2xl bg-zinc-50 border border-adhr-zinc-ulight group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:border-0">
          <p className="text-[13px] text-adhr-zinc-light font-medium tracking-tight group-data-[collapsible=icon]:hidden text-center">
            © 2026 ADHR Group
          </p>
          <div className="hidden group-data-[collapsible=icon]:block size-1.5 rounded-full bg-zinc-300" />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
