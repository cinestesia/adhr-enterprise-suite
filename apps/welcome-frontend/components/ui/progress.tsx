'use client'

import * as React from 'react'
import { Progress as ProgressPrimitive } from 'radix-ui'

import { cn } from '@/lib/utils'

// Estendiamo le proprietà per accettare la variante e la classe custom per l'indicatore interno
interface ProgressProps extends React.ComponentProps<typeof ProgressPrimitive.Root> {
  variant?: 'default' | 'micro'
  indicatorClassName?: string // <-- Prop parametrica per il colore della barra interna
}

function Progress({
  className,
  value,
  variant = 'default',
  indicatorClassName,
  ...props
}: ProgressProps) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        'relative flex w-full items-center overflow-x-hidden rounded-full bg-muted transition-all',
        variant === 'default' ? 'h-2' : 'h-1 mt-0.5 shrink-0',
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          'size-full flex-1 transition-all duration-300 ease-out',
          // COLORE DI DEFAULT: se è micro usa il tuo giallino 'bg-warning', altrimenti il colore primario
          variant === 'micro' ? 'bg-warning' : 'bg-primary',
          // Permette di sovrascrivere o estendere il colore direttamente quando richiami il componente
          indicatorClassName
        )}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
