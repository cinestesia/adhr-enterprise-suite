export interface IFileStoragePort {
    // Carica il file e restituisce il percorso o l'URL
    upload(fileBuffer: Buffer, filename: string): Promise<string>

    // Legge il file e restituisce il buffer (necessario per i loader)
    read(location: string): Promise<Buffer>
}
