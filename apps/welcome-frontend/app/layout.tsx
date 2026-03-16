import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/sonner"; // Lo aggiungeremo tra poco
import { TooltipProvider } from "@/components/ui/tooltip" // Importalo!

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: 'Gestionale Pro | Dashboard',
    description: 'Sistema di gestione aziendale avanzato',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        // Aggiungiamo suppressHydrationWarning per evitare errori col ThemeSwitch
        <html lang="it" suppressHydrationWarning>
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                <TooltipProvider delayDuration={0}>
                    {children}
                </TooltipProvider>
                {/* Il Toaster sta qui così è disponibile in tutta l'app */}
                <Toaster />
            </body>
        </html>
    );
}