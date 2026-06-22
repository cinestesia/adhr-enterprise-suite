import { IFileStoragePort } from '@/modules/shared/domain/ports/file-storage.port'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

export class LocalStorageAdapter implements IFileStoragePort {
    private uploadDir = path.join(process.cwd(), 'uploads')

    async upload(fileBuffer: Buffer, fileName: string): Promise<string> {
        const filePath = path.join(this.uploadDir, fileName)
        const targetDir = path.dirname(filePath)
        // Creiamo ricorsivamente tutte le cartelle necessarie (inclusa cv-prova/)
        await mkdir(targetDir, { recursive: true })
        //await mkdir(this.uploadDir, { recursive: true })
        await writeFile(filePath, fileBuffer)
        return filePath
    }

    async read(location: string): Promise<Buffer> {
        return readFile(location)
    }
}
