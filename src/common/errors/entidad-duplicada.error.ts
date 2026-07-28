import { ErrorDeNegocio } from './error-de-negocio'

export class EntidadDuplicadaError extends ErrorDeNegocio {
  readonly codigo = 'ENTIDAD_DUPLICADA'
  readonly httpStatus = 409

  constructor(entidad: string, campo: string, valor: string) {
    super(`Ya existe ${entidad} con ${campo} = ${valor}`)
  }
}
