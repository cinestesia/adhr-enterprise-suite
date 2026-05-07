import { IngestRequestDTO } from '@/dtos/ingest-request.dto'

export class FileMapper {
    static async toIngestDTO(multipartData: any): Promise<Partial<IngestRequestDTO>> {
        const buffer = await multipartData.toBuffer()       
        return {
            fileBuffer: buffer,
            fileName: multipartData.filename,
            department: multipartData.fields?.department?.value
        }
    }
}