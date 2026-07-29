import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const aseguradoraSchema = z.object({
  id: z.string(),
  codigoInterno: z.string(),
  nombre: z.string(),
  cuit: z.string().nullable(),
  activo: z.boolean(),
  // string, no z.date(): esto describe el JSON que sale por HTTP, no el tipo
  // interno de Prisma. z.date() no se puede representar en JSON Schema (rompe
  // Swagger al arrancar) y ZodSerializerDto valida la respuesta real en
  // runtime — necesita que el mapper ya haya convertido Date a ISO string
  // antes de llegar acá (ver aseguradoras.mapper.ts).
  creadoEn: z.iso.datetime(),
  actualizadoEn: z.iso.datetime(),
})

export class AseguradoraDto extends createZodDto(aseguradoraSchema) {}

export const aseguradoraListaSchema = z.object({
  items: z.array(aseguradoraSchema),
  total: z.number().int(),
  pagina: z.number().int(),
  porPagina: z.number().int(),
})

export class AseguradoraListaDto extends createZodDto(aseguradoraListaSchema) {}
