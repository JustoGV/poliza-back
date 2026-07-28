import { parsearDuracionMs } from './parsear-duracion'

describe('parsearDuracionMs', () => {
  it.each([
    ['15m', 15 * 60_000],
    ['7d', 7 * 86_400_000],
    ['30s', 30 * 1000],
    ['2h', 2 * 3_600_000],
    ['1d', 86_400_000],
  ])('convierte "%s" a %i ms', (entrada, esperado) => {
    expect(parsearDuracionMs(entrada)).toBe(esperado)
  })
})
