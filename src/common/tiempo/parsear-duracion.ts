type Unidad = 's' | 'm' | 'h' | 'd'

const MS_POR_UNIDAD: Record<Unidad, number> = {
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
}

/**
 * Traduce '15m' / '7d' (el formato de JWT_ACCESS_TTL y JWT_REFRESH_TTL,
 * validado por regex en env.schema.ts) a milisegundos, para calcular
 * `refresh_token.expira_en` sin depender de una lib externa para un formato
 * que ya validamos nosotros mismos al arrancar.
 */
export function parsearDuracionMs(duracion: string): number {
  const texto = duracion.trim()
  const unidad = texto.charAt(texto.length - 1) as Unidad
  const cantidad = Number(texto.slice(0, -1))
  return cantidad * MS_POR_UNIDAD[unidad]
}
