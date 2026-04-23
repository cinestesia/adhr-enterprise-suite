'use client' // Necessario per usare usePathname

import { usePathname } from 'next/navigation'
import { AppSidebar } from '@/components/AppSidebarOld'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import React from 'react'

const routeNames: Record<string, string> = {
  '/': 'Dashboard',
  '/ai-bot': 'Chatbot',
  '/clients': 'Gestione Clienti',
  '/settings': 'Configurazioni',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Trasforma l'URL "/dashboard/ui-bot" in un array: ["dashboard", "ui-bot"]
  const pathSegments = pathname.split('/').filter(Boolean)

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar />

        <main className="flex-1 overflow-y-auto bg-secondary/10">
          <header
            className="
            flex 
            h-16 
            shrink-0 items-center justify-between border-b px-6 bg-[image:var(--background-image-adhr-gradient)] shadow-md text-white sticky top-0 z-10"
          >
            <div className="flex items-center gap-4">
              <SidebarTrigger className="-ml-1 text-white hover:bg-white/20" />

              <div className="h-4 w-px bg-white/20 hidden md:block" />

              {/* BREADCRUMB DINAMICO, SNELLO E INTELLIGENTE */}
              <Breadcrumb className="hidden md:block text-white/90 text-sm">
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-white font-bold">
                      {/* Se l'array è vuoto siamo su "/", altrimenti prende il nome dal dizionario */}
                      {pathSegments.length === 0
                        ? routeNames['/']
                        : routeNames[pathname] ||
                          pathSegments[pathSegments.length - 1].replace(/-/g, ' ')}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            <div className="flex items-center gap-6">
              <Image
                src="/logo_adhr.png"
                alt="ADHR Logo"
                width={100}
                height={28}
                className="h-7 w-auto object-contain"
              />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full p-0 hover:bg-white/10"
                  >
                    <Avatar className="h-9 w-9 border-2 border-white/60">
                      <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                      <AvatarFallback className="bg-white text-primary font-bold text-xs">
                        AD
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent className="w-60" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        Nome Utente Keycloak
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        email.utente@adhr.it
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Profilo Aziendale</DropdownMenuItem>
                  <DropdownMenuItem>Impostazioni App</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50">
                    Disconnetti
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <div className="p-6">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  )
}
