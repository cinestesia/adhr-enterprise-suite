import type { NextConfig } from 'next';

/**
 * standalone: dice a Next.js di creare una cartella speciale che
 * contiene solo lo stretto necessario per far girare l'app, senza 
 * portarsi dietro tutta la cartella node_modules originale 
 * ( che di solito è gigantesca ).
 * 
 * Leggerezza: Le dimensioni dell'immagine Docker si riducono anche dell'80-90%.
 */ 

const nextConfig: NextConfig = {
    output: 'standalone', 
    env: {
        DATABASE_URL: process.env.DATABASE_URL,
        LOG_LEVEL: process.env.LOG_LEVEL,
        PORT: process.env.PORT,
    },
    /* config options here */
};

export default nextConfig;
