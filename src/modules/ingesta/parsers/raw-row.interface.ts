/**
 * Salida de EXTRACT (paso 3 del pipeline, CLAUDE.md). Una fila del archivo
 * origen, sin interpretar todavía — eso lo hace TRANSFORM (nivel 1) leyendo
 * `regla_homologacion`.
 */
export interface RawRow {
  /** 1-based, fila del archivo tal como la vería un humano abriéndolo. */
  readonly nroFila: number
  /** Clave = encabezado de columna tal como vino en el archivo. */
  readonly valores: Record<string, unknown>
}
