import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const sesionSchema = z.object({
  accessToken: z.string(),
  usuario: z.object({
    id: z.string(),
    email: z.string(),
    nombre: z.string(),
    rol: z.string(),
  }),
})

export class SesionDto extends createZodDto(sesionSchema) {}
