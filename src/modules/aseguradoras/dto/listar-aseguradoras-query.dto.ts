import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const listarAseguradorasQuerySchema = z.object({
  pagina: z.coerce.number().int().positive().default(1),
  porPagina: z.coerce.number().int().positive().max(100).default(20),
  // z.coerce.boolean() NO sirve para query strings: Boolean("false") es true.
  // Se acepta el string literal y se traduce a mano.
  activo: z
    .enum(['true', 'false'])
    .optional()
    .transform((valor) => (valor === undefined ? undefined : valor === 'true')),
  buscar: z.string().trim().min(1).max(200).optional(),
})

export class ListarAseguradorasQueryDto extends createZodDto(listarAseguradorasQuerySchema) {}
