'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link' // <== IMPORTATO LINK PER NAVIGAZIONE VELOCE
import {
  LayoutDashboard,
  Users,
  Settings,
  Package,
  ChevronUp,
  User2,
  LogOut,
  UserCircle,
} from 'lucide-react'

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
} from '@/components/ui/sidebar'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/useAuth'
import Image from 'next/image'
import { signOut, useSession } from 'next-auth/react'

const items = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Chatbot', url: '/ai-bot', icon: Users },
  { title: 'Gestione Clienti', url: '/clients', icon: Package },
  { title: 'Configurazioni', url: '/settings', icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { data: session } = useSession()

  const handleLogout = async () => {
    const res = await fetch('/api/auth/logout')
    const { idToken } = await res.json()
    const issuer = process.env.NEXT_PUBLIC_AUTH_KEYCLOAK_ISSUER
    const redirectUri = encodeURIComponent(window.location.origin + '/')

    const logoutUrl =
      `${issuer}/protocol/openid-connect/logout` +
      `?post_logout_redirect_uri=${redirectUri}` +
      `&id_token_hint=${idToken}`

    await signOut({ redirect: false })
    window.location.href = logoutUrl
  }

  return (
    <Sidebar
      variant="sidebar"
      collapsible="icon"
      className="border-r border-zinc-200 shadow-2xl"
    >
      <SidebarHeader className="h-24 flex items-center justify-center border-b bg-white group-data-[collapsible=icon]:h-20 transition-all duration-300">
        <div className="flex items-center justify-center w-full px-4">
          <div
            className={`
              flex flex-col items-center justify-center rounded-2xl shrink-0 transition-all duration-300
              bg-[image:var(--background-image-adhr-gradient)] 
              border border-white/20
              h-20 w-full group-data-[collapsible=icon]:h-6 group-data-[collapsible=icon]:w-6
          `}
          >
            <Image
              width={120}
              height={32}
              src="/logo_adhr.png"
              alt="ADHR Logo"
              className="h-8 w-auto object-contain transition-all group-data-[collapsible=icon]:h-4"
            />
            <div className="flex flex-col items-center mt-2 group-data-[collapsible=icon]:hidden">
              <div className="h-[1px] w-12 bg-white/30 mb-2" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/90 leading-tight">
                Group Suite App
              </span>
            </div>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="bg-white">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 px-4 mb-4">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {items.map((item) => {
                // LOGICA DI ATTIVAZIONE AVANZATA
                const isActive = 
                  pathname === item.url || 
                  (item.url !== '/' && pathname.startsWith(item.url))

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={`
                        transition-all duration-200 py-6 px-4
                        data-[active=true]:bg-[#A00407]/10 
                        data-[active=true]:text-[#A00407] 
                        hover:bg-zinc-100 
                        group-data-[collapsible=icon]:py-6
                      `}
                    >
                      {/* Usato Link al posto di <a> */}
                      <Link href={item.url} className="flex items-center gap-4">
                        <item.icon
                          className={`size-5 ${isActive ? 'text-[#A00407] stroke-[3px]' : 'text-zinc-500'}`}
                        />
                        <span
                          className={`text-[15px] ${isActive ? 'font-bold' : 'font-medium'}`}
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

      <SidebarFooter className="border-t bg-zinc-50/50 p-2 group-data-[collapsible=icon]:p-1 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="hover:bg-zinc-200/50 transition-all rounded-xl border border-transparent hover:border-zinc-200 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:p-0"
                >
                  <div className="flex items-center justify-center rounded-full bg-[#A00407]/10 border border-[#A00407]/20 p-2 shrink-0">
                    <User2 className="size-5 text-[#A00407]" />
                  </div>
                  <div className="flex flex-col items-start text-sm group-data-[collapsible=icon]:hidden ml-3">
                    <span className="font-bold text-zinc-800 truncate w-32">
                      {user?.name}
                    </span>
                    <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-tighter">
                      {user?.email}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto size-4 group-data-[collapsible=icon]:hidden text-zinc-400" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="start"
                className="w-64 rounded-2xl p-2 shadow-2xl border-zinc-200"
              >
                <DropdownMenuItem className="gap-3 cursor-pointer py-3 rounded-lg focus:bg-zinc-100">
                  <UserCircle className="size-5 text-zinc-500" />
                  <span className="font-medium">Il mio Profilo</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-3 cursor-pointer py-3 rounded-lg focus:bg-zinc-100">
                  <Settings className="size-5 text-zinc-500" />
                  <span className="font-medium">Impostazioni Account</span>
                </DropdownMenuItem>
                <hr className="my-2 border-zinc-100" />
                <DropdownMenuItem className="gap-3 cursor-pointer py-3 rounded-lg focus:bg-red-50 text-[#EC010C] focus:text-[#EC010C]">
                  <LogOut className="size-5" />
                  <span onClick={handleLogout} className="font-bold">
                    Disconnetti
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}