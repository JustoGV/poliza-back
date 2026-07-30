import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const listarClientesQuerySchema = z.object({
  pagina: z.coerce.number().int().positive().default(1),
  porPagina: z.coerce.number().int().positive().max(100).default(20),
  activo: z
    .enum(['true', 'false'])
    .optional()
    .transform((valor) => (valor === undefined ? undefined : valor === 'true')),
  requiereRevision: z
    .enum(['true', 'false'])
    .optional()
    .transform((valor) => (valor === undefined ? undefined : valor === 'true')),
  buscar: z.string().trim().min(1).max(200).optional(),
})

export class ListarClientesQueryDto extends createZodDto(listarClientesQuerySchema) {}
