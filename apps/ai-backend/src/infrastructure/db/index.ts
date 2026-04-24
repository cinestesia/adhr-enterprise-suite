import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema' // Importa tutto lo schema che hai appena scritto

// La stringa di connessione ad Azure Postgres
const connectionString = process.env.DATABASE_URL!

// Configurazione del client Postgres nativo
const client = postgres(connectionString, { 
    prepare: false // Spesso necessario con Azure o PGBouncer
})

// Esportazione dell'istanza DB tipizzata con il tuo schema
export const db = drizzle(client, { schema })