/**
 * Base de los errores de negocio. Nunca se lanza directamente: cada caso
 * concreto extiende esta clase y declara su propio código y status HTTP.
 * `ErroresDeNegocioFilter` los mapea a la respuesta HTTP leyendo `httpStatus`,
 * así que agregar un error nuevo nunca implica tocar el filtro.
 *
 * CLAUDE.md: "Errores de negocio como clases tipadas que extienden una base
 * común, nunca throw new Error()". La regla está además codificada en
 * eslint.config.mjs (no-restricted-syntax sobre `throw new Error`).
 */
export abstract class ErrorDeNegocio extends Error {
  abstract readonly codigo: string
  abstract readonly httpStatus: number

  constructor(message: string) {
    super(message)
    this.name = new.target.name
  }
}
