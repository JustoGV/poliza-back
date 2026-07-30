import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

function boolQueryParam() {
  return z
    .enum(['true', 'false'])
    .optional()
    .transform((valor) => (valor === undefined ? undefined : valor === 'true'))
}

export const listarPolizasQuerySchema = z.object({
  pagina: z.coerce.number().int().positive().default(1),
  porPagina: z.coerce.number().int().positive().max(100).default(20),
  aseguradoraId: z.string().trim().min(1).optional(),
  clienteId: z.string().trim().min(1).optional(),
  estado: z.enum(['VIGENTE', 'NO_VIGENTE']).optional(),
  sinHomologar: boolQueryParam(),
  posibleBaja: boolQueryParam(),
  buscar: z.string().trim().min(1).max(200).optional(),
})

export class ListarPolizasQueryDto extends createZodDto(listarPolizasQuerySchema) {}
