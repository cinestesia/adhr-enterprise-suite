import { IFileStoragePort } from '@/domain/ports/file-storage.port'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

export class LocalStorageAdapter implements IFileStoragePort {
    private uploadDir = path.join(process.cwd(), 'uploads')

    async upload(fileBuffer: Buffer, fileName: string): Promise<string> {
        await mkdir(this.uploadDir, { recursive: true })
        const filePath = path.join(this.uploadDir, fileName)
        await writeFile(filePath, fileBuffer)
        return filePath
    }

    async read(location: string): Promise<Buffer> {
        return readFile(location)
    }
}
