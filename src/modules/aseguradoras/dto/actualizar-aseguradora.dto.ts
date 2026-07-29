import { createZodDto } from 'nestjs-zod'
import { crearAseguradoraSchema } from './crear-aseguradora.dto'

export const actualizarAseguradoraSchema = crearAseguradoraSchema.partial()

export class ActualizarAseguradoraDto extends createZodDto(actualizarAseguradoraSchema) {}
