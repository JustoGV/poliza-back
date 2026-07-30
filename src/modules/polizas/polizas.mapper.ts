import type { Poliza } from '@/generated/prisma/client'
import type { z } from 'zod'
import type { polizaSchema } from './dto/poliza.dto'

export function mapearPoliza(
  poliza: Poliza,
  mostrarDatosFinancieros: boolean,
): z.infer<typeof polizaSchema> {
  return {
    id: poliza.id,
    aseguradoraId: poliza.aseguradoraId,
    clienteId: poliza.clienteId,
    numeroPoliza: poliza.numeroPoliza,
    numeroEndoso: poliza.numeroEndoso,
    ramoId: poliza.ramoId,
    productoId: poliza.productoId,
    ramoOrigen: poliza.ramoOrigen,
    productoOrigen: poliza.productoOrigen,
    vigenciaDesde: poliza.vigenciaDesde ? poliza.vigenciaDesde.toISOString().slice(0, 10) : null,
    vigenciaHasta: poliza.vigenciaHasta ? poliza.vigenciaHasta.toISOString().slice(0, 10) : null,
    estado: poliza.estado,
    estadoOrigen: poliza.estadoOrigen,
    // Decisión abierta D1: el dato se persiste siempre, la serialización se
    // gatea por AppConfigService.featureDatosFinancieros.
    ...(mostrarDatosFinancieros
      ? {
          prima: poliza.prima?.toString() ?? null,
          premio: poliza.premio?.toString() ?? null,
          comisionPct: poliza.comisionPct?.toString() ?? null,
        }
      : {}),
    moneda: poliza.moneda,
    formaPago: poliza.formaPago,
    productorCodigo: poliza.productorCodigo,
    sinHomologar: poliza.sinHomologar,
    posibleBaja: poliza.posibleBaja,
    creadoEn: poliza.creadoEn.toISOString(),
    actualizadoEn: poliza.actualizadoEn.toISOString(),
  }
}
