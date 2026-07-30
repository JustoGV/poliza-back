import { createZodDto } from 'nestjs-zod'
import { polizaBaseSchema, validarVentanaVigencia } from './crear-poliza.dto'

// aseguradoraId no se edita: es parte de la clave natural de deduplicación.
export const actualizarPolizaSchema = polizaBaseSchema.partial().superRefine(validarVentanaVigencia)

export class ActualizarPolizaDto extends createZodDto(actualizarPolizaSchema) {}
