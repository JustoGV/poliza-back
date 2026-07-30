import { createZodDto } from 'nestjs-zod'
import { clienteBaseSchema, validarParDocumento } from './crear-cliente.dto'

export const actualizarClienteSchema = clienteBaseSchema.partial().superRefine((datos, ctx) => {
  validarParDocumento(datos, ctx)
})

export class ActualizarClienteDto extends createZodDto(actualizarClienteSchema) {}
