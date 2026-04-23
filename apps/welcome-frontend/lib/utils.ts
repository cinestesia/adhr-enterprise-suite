import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
/**
 * clsx permette di aggiungere classi solo se una condizione è vera, senza dover usare template literals
 * complessi o fare controlli manuali sulle stringhe.
 *
 * senza cn:
 * <div className={`p-4 ${isActive ? 'bg-blue-500' : 'bg-gray-200'} ${className}`}>
 *
 * con cn:
 * <div className={cn("p-4", isActive ? "bg-blue-500" : "bg-gray-200", className)}>
 *
 * twMerge: Risoluzione dei conflitti (Fondamentale)
 * Questo è il vero "potere" della funzione. Tailwind non sa quale classe vince se ne
 * metti due contrastanti. Se scrivi class="p-4 p-8", il CSS standard potrebbe non
 * comportarsi come ti aspetti. twMerge capisce che sono entrambe utility di "padding"
 * e tiene solo l'ultima, eliminando la prima.
 *
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}
