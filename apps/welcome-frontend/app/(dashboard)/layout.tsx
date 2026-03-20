// STRUTTURA

import { AppSidebar } from '@/components/AppSidebar'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import Image from 'next/image'

// ├── app/
// │   ├── (auth)/                # Gruppo per Login/Register (senza sidebar)
// │   │   ├── login/page.tsx
// │   │   └── layout.tsx
// │   ├── (dashboard)/           # Gruppo con Sidebar e Guardie
// │   │   ├── layout.tsx         # Qui inseriamo Sidebar, Navbar e Auth Guard
// │   │   ├── page.tsx           # Overview/Statistiche
// │   │   └── users/             # Sottopagina utenti
// │   │       ├── page.tsx
// │   │       └── [id]/page.tsx
// │   ├── api/                   # Route handlers (Backend)
// │   └── layout.tsx             # Root layout (Providers: Theme, Query, Auth)
// ├── components/
// │   ├── dashboard/             # Componenti specifici (Sidebar, Nav, UserButton)
// │   ├── forms/                 # Logica dei form (React Hook Form + Zod)
// │   └── ui/                    # Componenti shadcn (vanno qui o nel pacchetto shared)
// ├── hooks/                     # Custom hooks (es. use-sidebar.ts)
// ├── lib/                       # Utility (auth.ts, utils.ts, validazioni)
// └── middleware.ts              # La "Guardia" principale (Edge Runtime)

/**
 * Il cuore dell'esperienza UX risiede in (dashboard)/layout.tsx: dove avvolgiamo il contenuto in una SidebarProvider
 * (di shadcn) e verifichi se l'utente è autenticato.
 *
 * middleware.ts: È la tua prima linea di difesa. Controlla il session token e reindirizza a /login se
 * l'utente non è autorizzato, prima ancora che la pagina venga renderizzata.
 *
 * Separazione delle Concerns: I componenti in ui/ sono "stupidi" (solo stile), mentre quelli in dashboard/
 * gestiscono i dati.
 *
 * # Esempio: aggiungere lucide-react solo all'app "welcome-frontend"
 * pnpm add lucide-react --filter web
 * pnpm remove lucide-react --filter web
 * npx shadcn@latest add sonner
 * npx shadcn@latest add sidebar
 * npx shadcn@latest add dropdown-menu
 *
 * # Aggiungere un pacchetto a tutti i workspace ( nelle root )
 * pnpm add -w typescript
 *
 * @ROUTE_GROUP
 * Le () in Next.js servono a specificare i Route Group. Ogni cartella dentro di solito diventa un pezzo dell'url:
 * (es: app/contatti/page.tsx → /contatti). Le cartelle con le parentesi sono l'eccezione: vengono ignorate dall'URL
 * ma servono per:
 *
 * Organizzazione logica: Raggruppare rotte correlate (es. tutto ciò che riguarda l'autenticazione) senza sporcare
 * l'indirizzo web.
 *
 * Layout Multipli: Permettono di applicare layout diversi a gruppi di pagine diversi.
 *
 * app/(auth)/login/page.tsx        =>	/login   => layout in (auth) (niente sidebar)
 * app/(dashboard)/page.tsx	        =>  /        => layout in (dashboard) (con sidebar)
 * app/(dashboard)/users/page.tsx   =>  /users   => layout in (dashboard) (con sidebar)
 *
 * la parola (dashboard) scompare completamente dall'URL.
 *
 *  @MIDDLEWARE
 *  Useremo il file middleware.ts nella root. Lui non guarda le cartelle, guarda l'URL richiesto. Se l'utente prova
 *  ad andare su /users e non ha il cookie di sessione, il middleware lo rimbalza su /login.
 *
 *  @SHADCN
 *  In un'applicazione professionale, l'utente deve sentire che l'interfaccia è solida e reattiva. Useremo il componente
 *  Sidebar di shadcn/ui, che è diventato lo standard perché gestisce nativamente il mobile (collapsing),
 *  le scorciatoie da tastiera (Cmd+B) e lo stato di espansione.
 *
 *  1.  pnpm add lucide-react clsx tailwind-merge --filter welcome-frontend
 *
 *  2.  Installiamo il pacchetto sidebar di shadcn direttamente da welcome-frontend. Questo comando per esempio
 *      si limita ad installare in  components/ui i componenti necessari alla sidebar che gestirà come abbiamo detto
 *      il collapsing, le scorciatoie di tastiera e lo stato di espnsione.
 *      npx shadcn@latest add sidebar
 *
 * @CSS
 *
 * h-screen: Indica che l'elemento deve essere alto esattamente quanto l'altezza del display dell'utente (100vh).
 * A cosa serve: È fondamentale per creare "hero sections" o pagine che occupano tutto lo schermo senza lasciare
 * spazi bianchi sotto.
 *
 * w-full: Indica che l'elemento deve occupare il 100% della larghezza del suo contenitore genitore.
 * A cosa serve: Assicura che un elemento si espanda orizzontalmente per tutta la pagina o per tutto il box
 * in cui si trova.
 *
 * overflow-hidden: Questa è la "bacchetta magica" per la pulizia visiva. Impedisce che compaiano le barre di scorrimento (scrollbar)
 * e nasconde qualsiasi contenuto che esca dai bordi dell'elemento.
 * A cosa serve: Si usa spesso per evitare lo scroll orizzontale fastidioso o per "ritagliare"
 * immagini e animazioni che altrimenti sborderebbero.
 *
 * Insieme: stai creando un contenitore che riempie perfettamente lo schermo del PC o dello smartphone, agendo
 * come una sorta di "cornice fissa" dove nulla può scappare fuori e l'utente non può scrollare.
 *
 * flex-1: è il riempitivo intelligente. Questa classe dice all'elemento di espandersi per occupare tutto lo spazio
 * rimanente all'interno di un contenitore Flexbox.
 *
 * bg-secondary: Applica il colore definito come "secondario" nel tuo file di configurazione (spesso un grigio o un blu tenue).
 *
 * overflow-y: overflow solo verticale
 *
 * /10: È il modificatore di opacità. In questo caso, il colore sarà al 10% di opacità (molto trasparente, quasi un velo).
 *
 * Insieme: "Prendi tutto lo spazio che trovi (flex-1), se il contenuto esce dai bordi fammi scrollare verso il basso
 * (overflow-y-auto) e colorami con un leggerissimo tocco del colore secondario del brand (bg-secondary/10)."
 * 
 * failes
 */

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar />

        <main className="flex-1 overflow-y-auto bg-secondary/10">
          {/* Header con il tuo gradiente aziendale */}
          <header className="flex h-16 shrink-0 items-center gap-4 border-b px-4 bg-[image:var(--background-image-adhr-gradient)] shadow-md text-white">
            <SidebarTrigger className="-ml-1 text-white hover:bg-white/20" />
            {/* Logo posizionato a destra nell'header */}
            <Image
              src="/logo_adhr.png"
              alt="ADHR Logo"
              width={120}
              height={32}
              className="h-8 w-auto object-contain"
            />
            <div className="flex flex-1 items-center justify-between">
              <h1 className="text-sm font-bold tracking-tight uppercase">
                WELCOME ADHR GROUP SUITE APP
              </h1>
            </div>
          </header>

          {/* Il contenuto della pagina */}
          <div className="p-6">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  )
}
