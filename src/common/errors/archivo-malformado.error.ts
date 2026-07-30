import { ErrorDeNegocio } from './error-de-negocio'

export class ArchivoMalformadoError extends ErrorDeNegocio {
  readonly codigo = 'ARCHIVO_MALFORMADO'
  readonly httpStatus = 422

  constructor(detalle: string) {
    super(`El archivo no tiene una estructura XLSX válida: ${detalle}`)
  }
}
