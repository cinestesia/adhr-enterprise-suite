import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {

        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        outline:
          "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
        
        // --- VARIANTE PERSONALIZZATA ---
        //coming_soon: "border-zinc-100 bg-zinc-50 text-zinc-700 shadow-sm dark:bg-zinc-950/20 dark:text-zinc-400",
        //success: "border-emerald-100 bg-emerald-50 text-emerald-700 shadow-sm dark:bg-emerald-950/20 dark:text-emerald-400",
        coming_soon: "text-xs font-medium px-3 py-1 rounded-full  shadow-md border-[1.5px] bg-coming-soon-light border-coming-soon-text/20 text-coming-soon-text dark:bg-coming-soon-light/10 dark:border-coming-soon-text/10",
        success: "text-xs font-medium px-3 py-1 rounded-full shadow-md border-[1.5px] bg-success-badge-light border-success-badge-text/20 text-success-badge-text dark:bg-success-badge-light/10 dark:border-success-badge-text/10"
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
