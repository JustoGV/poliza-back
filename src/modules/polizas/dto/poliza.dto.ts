import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const polizaSchema = z.object({
  id: z.string(),
  aseguradoraId: z.string(),
  clienteId: z.string(),
  numeroPoliza: z.string(),
  numeroEndoso: z.string(),
  ramoId: z.string().nullable(),
  productoId: z.string().nullable(),
  ramoOrigen: z.string().nullable(),
  productoOrigen: z.string().nullable(),
  vigenciaDesde: z.iso.date().nullable(),
  vigenciaHasta: z.iso.date().nullable(),
  estado: z.enum(['VIGENTE', 'NO_VIGENTE']),
  estadoOrigen: z.string().nullable(),
  // Presentes sólo si FEATURE_DATOS_FINANCIEROS está en true — ver
  // AppConfigService.featureDatosFinancieros y decisión abierta D1.
  prima: z.string().nullable().optional(),
  premio: z.string().nullable().optional(),
  comisionPct: z.string().nullable().optional(),
  moneda: z.string(),
  formaPago: z.string().nullable(),
  productorCodigo: z.string().nullable(),
  sinHomologar: z.boolean(),
  posibleBaja: z.boolean(),
  creadoEn: z.iso.datetime(),
  actualizadoEn: z.iso.datetime(),
})

export class PolizaDto extends createZodDto(polizaSchema) {}

export const polizaListaSchema = z.object({
  items: z.array(polizaSchema),
  total: z.number().int(),
  pagina: z.number().int(),
  porPagina: z.number().int(),
})

export class PolizaListaDto extends createZodDto(polizaListaSchema) {}
