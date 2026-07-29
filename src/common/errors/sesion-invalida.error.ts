import { ErrorDeNegocio } from './error-de-negocio'

/**
 * Refresh token ausente, vencido, revocado o reusado. Nunca detalla el motivo
 * puntual en la respuesta — evita filtrar si se detectó un reuso (posible
 * token robado) vs. una expiración normal.
 */
export class SesionInvalidaError extends ErrorDeNegocio {
  readonly codigo = 'SESION_INVALIDA'
  readonly httpStatus = 401

  constructor() {
    super('Sesión inválida, iniciar sesión nuevamente')
  }
}
