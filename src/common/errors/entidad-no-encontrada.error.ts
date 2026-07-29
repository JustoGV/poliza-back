import { ErrorDeNegocio } from './error-de-negocio'

export class EntidadNoEncontradaError extends ErrorDeNegocio {
  readonly codigo = 'ENTIDAD_NO_ENCONTRADA'
  readonly httpStatus = 404

  constructor(entidad: string, id: string) {
    super(`${entidad} no encontrada: ${id}`)
  }
}
