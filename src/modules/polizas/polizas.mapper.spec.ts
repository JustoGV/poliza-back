import type { Poliza } from '@/generated/prisma/client'
import { mapearPoliza } from './polizas.mapper'

function crearPolizaFila(overrides: Partial<Poliza> = {}): Poliza {
  return {
    id: 'poliza-1',
    aseguradoraId: 'aseguradora-1',
    clienteId: 'cliente-1',
    numeroPoliza: '1240112',
    numeroEndoso: '0',
    ramoId: null,
    productoId: null,
    ramoOrigen: 'AUTOMOTOR',
    productoOrigen: null,
    vigenciaDesde: null,
    vigenciaHasta: null,
    estado: 'VIGENTE',
    estadoOrigen: null,
    // Casteado: el generador de Prisma expone Decimal.js real en runtime, acá
    // sólo importa que .toString() exista.
    prima: { toString: () => '1500.50' } as unknown as Poliza['prima'],
    premio: { toString: () => '1815.00' } as unknown as Poliza['premio'],
    comisionPct: { toString: () => '12.5' } as unknown as Poliza['comisionPct'],
    moneda: 'ARS',
    formaPago: null,
    productorCodigo: null,
    sinHomologar: true,
    posibleBaja: false,
    rawSource: null,
    importacionId: null,
    creadoEn: new Date('2026-01-01T00:00:00Z'),
    actualizadoEn: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  }
}

describe('mapearPoliza', () => {
  it('omite prima/premio/comisionPct cuando el flag está apagado', () => {
    const resultado = mapearPoliza(crearPolizaFila(), false)

    expect(resultado.prima).toBeUndefined()
    expect(resultado.premio).toBeUndefined()
    expect(resultado.comisionPct).toBeUndefined()
  })

  it('incluye prima/premio/comisionPct cuando el flag está prendido', () => {
    const resultado = mapearPoliza(crearPolizaFila(), true)

    expect(resultado.prima).toBe('1500.50')
    expect(resultado.premio).toBe('1815.00')
    expect(resultado.comisionPct).toBe('12.5')
  })

  it('null en un monto se conserva null con el flag prendido', () => {
    const resultado = mapearPoliza(crearPolizaFila({ prima: null }), true)

    expect(resultado.prima).toBeNull()
  })
})
