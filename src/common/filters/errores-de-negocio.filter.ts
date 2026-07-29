import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common'
import { Catch, Logger } from '@nestjs/common'
import type { Response } from 'express'
import { ErrorDeNegocio } from '../errors'

@Catch(ErrorDeNegocio)
export class ErroresDeNegocioFilter implements ExceptionFilter {
  private readonly logger = new Logger(ErroresDeNegocioFilter.name)

  catch(exception: ErrorDeNegocio, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>()
    this.logger.warn(`${exception.codigo}: ${exception.message}`)
    response.status(exception.httpStatus).json({
      statusCode: exception.httpStatus,
      codigo: exception.codigo,
      mensaje: exception.message,
    })
  }
}
