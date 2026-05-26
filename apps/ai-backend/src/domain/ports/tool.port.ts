// apps/ai-backend/src/domain/ports/tool.port.ts
import { ToolSpecification, ToolExecutionContext } from '../models/agent.model'

export interface ITool {
    get specification(): ToolSpecification
    execute(input: Record<string, any>, context: ToolExecutionContext): Promise<string>
}
