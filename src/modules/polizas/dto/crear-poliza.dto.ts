import { createZodDto } from 'nestjs-zod'
import z from 'zod'

const montoSchema = z
  .string()
  .trim()
  .regex(/^\d{1,13}(\.\d{1,2})?$/, 'Monto inválido — hasta 2 decimales')

export const polizaBaseSchema = z.object({
  clienteId: z.string().trim().min(1),
  numeroPoliza: z.string().trim().min(1).max(60),
  numeroEndoso: z.string().trim().min(1).max(20).default('0'),
  // Valor crudo de la aseguradora. ramoId/productoId los asigna el motor de
  // homologación (F4-19), no la carga manual.
  ramoOrigen: z.string().trim().min(1).max(200).optional(),
  productoOrigen: z.string().trim().min(1).max(200).optional(),
  vigenciaDesde: z.iso.date().optional(),
  vigenciaHasta: z.iso.date().optional(),
  estado: z.enum(['VIGENTE', 'NO_VIGENTE']).default('VIGENTE'),
  prima: montoSchema.optional(),
  premio: montoSchema.optional(),
  comisionPct: z
    .string()
    .trim()
    .regex(/^\d{1,3}(\.\d{1,4})?$/, 'Porcentaje inválido — hasta 4 decimales')
    .optional(),
  moneda: z.string().trim().length(3).default('ARS'),
  formaPago: z.string().trim().min(1).max(60).optional(),
  productorCodigo: z.string().trim().min(1).max(40).optional(),
})

export function validarVentanaVigencia(
  datos: { vigenciaDesde?: string | undefined; vigenciaHasta?: string | undefined },
  ctx: z.RefinementCtx,
) {
  if (
    datos.vigenciaDesde !== undefined &&
    datos.vigenciaHasta !== undefined &&
    datos.vigenciaHasta < datos.vigenciaDesde
  ) {
    ctx.addIssue({
      code: 'custom',
      message: 'vigenciaHasta no puede ser anterior a vigenciaDesde',
      path: ['vigenciaHasta'],
    })
  }
}

export const crearPolizaSchema = polizaBaseSchema.extend({
  aseguradoraId: z.string().trim().min(1),
}).superRefine(validarVentanaVigencia)

export class CrearPolizaDto extends createZodDto(crearPolizaSchema) {}
