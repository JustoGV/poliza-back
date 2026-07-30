import { ErrorDeNegocio } from './error-de-negocio'

export class ParserNoEncontradoError extends ErrorDeNegocio {
  readonly codigo = 'PARSER_NO_ENCONTRADO'
  readonly httpStatus = 422

  constructor(parserKey: string) {
    super(`No hay un parser registrado para parser_key: ${parserKey}`)
  }
}
