import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

export const createDbClient = (connectionString: string) => {
    const client = postgres(connectionString, {
        prepare: false,
    })
    return drizzle(client, { schema })
}

// Esporta il tipo per usarlo negli adapter
export type DbInstance = ReturnType<typeof createDbClient>
