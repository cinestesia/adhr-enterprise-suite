import { defineConfig } from 'drizzle-kit'

export default defineConfig({
    schema: './src/modules/shared/infrastructure/db/schema.ts', // Percorso del tuo file schema
    out: './drizzle', // Cartella dove verranno salvate le migrazioni SQL
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL!, // La stringa di Azure che abbiamo definito
    },
})
