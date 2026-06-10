export interface IDocumentParserPort {
    parseToText(fileBuffer: Buffer, fileName: string): Promise<string>
}