/**
 * @NOTE
 * Layout di base dell'applicazione. Qui possiamo inserire componenti o
 * provider che devono essere disponibili in tutta l'app.
 */

import { Geist, Geist_Mono, Special_Elite } from 'next/font/google'
import './globals.css' // Importiamo i nostri stili globali, che includono anche le variabili css dei font
import SessionWrapper from '@/components/SessionWrapper'
import { TooltipProvider } from '@/components/ui/tooltip'

/**
 * Caratteri tipoografici (font) interessanti per l'app. Creiamo il carattere e lo esportiamo
 * come variabile css che poi utilizzeremo anche in globals.css per integrarlo col tema
 * Qui dico a Next.js di scaricare, ottimizzare e ospitare i file dei font.
 *
 * Quando scriviamo per esempio Special_Elite({ ... }), Next.js scarica automaticamente il font da
 * Google Fonts (o da un'altra sorgente) durante la fase di build.
 * Vantaggio: Il font viene servito direttamente dal server (self-hosted), il che è più veloce e
 * rispettoso della privacy (GDPR compliant) rispetto a caricarlo ogni volta dai server di Google.
 *
 * 1.   layout.tsx: Scarica i font e li "inietta" nell'HTML come variabili CSS (--special-src, ecc.).
 * 2.   globals.css: Prende quelle variabili e le mappa su classi di Tailwind (font-special).
 * 3.   I componenti: usiamo className="font-special" e Tailwind sa che deve applicare il font scaricato da Next.js.
 *
 */

const specialElite = Special_Elite({
  // Vecchia macchina da scrivere.
  variable: '--special-src', // Assegna questo font a questa variabile.
  weight: '400',
  subsets: ['latin'],
})

const geist = Geist({
  variable: '--geist-src',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--geist-mono-src',
  subsets: ['latin'],
})

export default function RootLayoutPage({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body
        className={`${geist.variable} ${geistMono.variable} ${specialElite.variable} antialiased`}
      >
        {/* <p className='font-geist'>ciao</p> */}
        {/* <p className='font-special'> font-special: emula una macchina da scrivere </p> */}

        <SessionWrapper>
          {/* Il TooltipProvider serve a definire il comportamente del tooltip  */}
          <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
        </SessionWrapper>
      </body>
    </html>
  )
}
