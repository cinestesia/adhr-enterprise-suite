import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

export const createDbClient = (connectionString: string) => {
    const client = postgres(connectionString, {
        prepare: false,
    })

    // Attiviamo il logger nativo di Drizzle nel secondo parametro di configurazione
    return drizzle(client, {
        schema,
        logger: true, // <--- Abilitando questo, Drizzle stamperà in console ogni query SQL generata dall'Agente
    })
}

// Esporta il tipo per usarlo negli adapter
export type DbInstance = ReturnType<typeof createDbClient>
