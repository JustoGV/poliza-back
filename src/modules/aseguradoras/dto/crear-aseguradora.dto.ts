import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const crearAseguradoraSchema = z.object({
  codigoInterno: z
    .string()
    .trim()
    .min(2, 'Mínimo 2 caracteres')
    .max(10, 'Máximo 10 caracteres')
    .transform((valor) => valor.toUpperCase()),
  nombre: z.string().trim().min(2, 'Mínimo 2 caracteres').max(200),
  cuit: z
    .string()
    .trim()
    .regex(/^\d{11}$/, 'El CUIT debe tener 11 dígitos, sin guiones')
    .optional(),
})

export class CrearAseguradoraDto extends createZodDto(crearAseguradoraSchema) {}
