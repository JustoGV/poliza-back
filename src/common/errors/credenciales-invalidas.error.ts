import { ErrorDeNegocio } from './error-de-negocio'

/**
 * Mensaje SIEMPRE genérico: CLAUDE.md prohíbe revelar si el email existe.
 * Se usa igual para email inexistente, contraseña incorrecta y usuario
 * inactivo — nunca un mensaje distinto por caso.
 */
export class CredencialesInvalidasError extends ErrorDeNegocio {
  readonly codigo = 'CREDENCIALES_INVALIDAS'
  readonly httpStatus = 401

  constructor() {
    super('Email o contraseña inválidos')
  }
}
