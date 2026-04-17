'use client'
import { AppNavbar } from "@/components/AppNavbar"
import { AppSidebar } from "@/components/AppSidebar"
import { SidebarProvider } from "@/components/ui/sidebar"

export default function DashboardLayoutPage({children}:{children:React.ReactNode}) {    
    return (
        <SidebarProvider>
            <AppSidebar />
            
            <div className="flex flex-col flex-1 h-screen overflow-hidden bg-secondary/10">
                <AppNavbar />
                
                <main className="flex-1 overflow-y-auto px-3 pb-3 md:px-3 md:pb-3">
                    <div className="min-h-full w-full bg-white md:rounded-xl shadow-sm border border-zinc-200/50 p-6">
                        {children}
                    </div>
                </main>
            </div>
        </SidebarProvider>
    )
}