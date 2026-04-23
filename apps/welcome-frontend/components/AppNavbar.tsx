'use client'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { getRouteMetadata } from '@/lib/get-launcher-apps'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Button } from './ui/button'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { useAuth } from '@/hooks/useAuth'

export function AppNavbar() {
  const pathname = usePathname()
  const { title } = getRouteMetadata(pathname)
  const { user } = useAuth()
  return (
    <header
      className="
            flex h-16 
            justify-between 
            items-center 
            gap-4 
            shrink-0 
            bg-adhr-gradient 
            /* Se usi i margini (m-3), aggiungi rounded-xl per un look moderno */
            md:m-3 md:rounded-xl
            px-4
            shadow-2xl shadow-adhr-zinc-shadow 
            sticky top-0 z-10
            transition-all duration-300"
    >
      <div className="flex items-center gap-4">
        <SidebarTrigger className="text-white/90 hover:bg-white/20 transition-colors" />

        <div className="h-6 w-px bg-white/20 hidden md:block" />

        <Breadcrumb className="hidden md:block">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage className="text-white/90 font-bold uppercase tracking-widest text-xs">
                {title}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-4 md:gap-8">
        {/* LOGO: rimpicciolito leggermente per eleganza e reso più 'brillante' */}
        <Image
          src="/logo_adhr.png"
          alt="ADHR Logo"
          width={100}
          height={28}
          className="h-6 w-auto object-contain brightness-0 invert opacity-90 hover:opacity-100 transition-opacity"
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-10 w-10 rounded-full p-0 hover:bg-white/10 ring-offset-primary focus-visible:ring-2 focus-visible:ring-white"
            >
              <Avatar className="h-10 w-10 border-[1.5px] border-white/80 shadow-lg transition-transform group-hover:scale-105 group-hover:border-white">
                <AvatarImage
                  src="https://robohash.org/ciccio"
                  alt="User"
                  className="bg-white bg-cover"
                />
                <AvatarFallback className="bg-white text-primary font-bold text-xs">
                  AD
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-64 p-2 shadow-lg shadow-adhr-zinc-shadow border-adhr-zinc-ulight"
            align="end"
          >
            <DropdownMenuLabel className="font-normal p-2">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-bold leading-none text-adhr-zinc-strong">
                  Utente
                </p>
                <p className="text-xs leading-none text-adhr-zinc-medium font-medium">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="my-2" />

            <DropdownMenuItem className="cursor-pointer py-2 px-3 rounded-md focus:bg-adhr-zinc-light/20 font-medium text-adhr-zinc-medium">
              Profilo Aziendale
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer py-2 px-3 rounded-md focus:bg-adhr-zinc-light/20 font-medium text-adhr-zinc-medium">
              Impostazioni App
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-2" />

            <DropdownMenuItem className="cursor-pointer py-2 px-3 rounded-md text-primary font-bold focus:bg-red-50 focus:text-primary">
              Disconnetti
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
