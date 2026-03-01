// import Image from 'next/image';

import { ConfigClientSide } from "@/components/ConfigClientSide";
import { ConfigServerSide } from "@/components/ConfigServerSide";

/**
 * Di default se non specifichaimo la direttiva use-client questo è un 
 * componente server side! Vuol dire che verrà eseguito lato server e 
 * avrà per definizione accesso alle variabili che abbiamo dichiarato
 * negli ambienti. 
 * 
 */

export default function Home() {
  return (
    <main className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        <ConfigServerSide />
        <ConfigClientSide /> 
    </main>
  )

}
