import { cn } from "@/lib/utils"

interface PageHeaderProps {
    title: string
    description?: string | React.ReactNode
    className?: string
    children?: React.ReactNode // Bottoni, badge, status aggiuntivi
}

export function PageHeader({title, description, className, children}: PageHeaderProps) {
    { /* 
            Uno dei vantaggi di utilizzare cn() è che se passiamo per esempio
            className="justify-center" deve vincere rispetto al precedente. 
            Senza cn() non sarebbe garantito, dipenderebbe dall'ordine scelto 
            da tailwind nel css.

        */ }
    return (
        <header className={cn("flex flex-col md:flex-row md:items-center justify-between gap-4", className)}>
            <div className="space-y-1">
                <h1 className="text-2xl text-zinc-900 dark:text-zinc-50 sm:text-3xl tracking-tight max-w-[600px]">
                    {title}
                </h1>
                {description && <p className="text-zinc-500">{description}</p>}
            </div>
            {children && <div className="flex items-center gap-3 shrink-0"> {children}</div>}
        </header>
    )
}
