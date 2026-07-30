import type { Readable } from 'node:stream'
import type { RawRow } from './raw-row.interface'

/**
 * El subconjunto de `perfil_importacion` que un parser necesita para leer el
 * archivo — nada de reglas de homologación, eso es nivel 1 (F4-08). La misma
 * clase de parser sirve a las 14 aseguradoras: lo que cambia entre una y
 * otra es este config, no el código (regla 1 de CLAUDE.md).
 */
export interface ConfigParser {
  nombreHoja: string | null
  filaEncabezado: number
  delimitador: string | null
  encoding: string
}

/**
 * Toda implementación se marca con `@RegistrarParser()` (ver
 * parser.decorator.ts) para que `ParserRegistry` la descubra sola.
 */
export interface Parser {
  /** Coincide con `perfil_importacion.parser_key`. Único por implementación. */
  readonly parserKey: string

  /**
   * EXTRACT (paso 3). Streaming siempre (regla 6) — nunca materializar el
   * archivo entero en memoria.
   */
  extract(archivo: Readable, config: ConfigParser): AsyncIterable<RawRow>
}
