import { ILogger } from '@/domain/ports/logger.port'
import { FastifyBaseLogger } from 'fastify'

export class PinoLoggerAdapter implements ILogger {
    constructor(private logger: FastifyBaseLogger) {}

    info(message: string, context?: Record<string, any>): void {
        if (context) this.logger.info(context, message)
        else this.logger.info(message)
    }

    error(message: string, error?: any, context?: Record<string, any>): void {
        this.logger.error({ err: error, ...context }, message)
    }

    warn(message: string, context?: Record<string, any>): void {
        if (context) this.logger.warn(context, message)
        else this.logger.warn(message)
    }

    debug(message: string, context?: Record<string, any>): void {
        if (context) this.logger.debug(context, message)
        else this.logger.debug(message)
    }
}
