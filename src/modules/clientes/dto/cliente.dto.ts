import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const clienteSchema = z.object({
  id: z.string(),
  tipoPersona: z.enum(['FISICA', 'JURIDICA']).nullable(),
  cuit: z.string().nullable(),
  tipoDocumento: z.enum(['DNI', 'LE', 'LC', 'CI', 'PASAPORTE', 'CUIT', 'CUIL']).nullable(),
  nroDocumento: z.string().nullable(),
  apellido: z.string().nullable(),
  nombre: z.string().nullable(),
  razonSocial: z.string().nullable(),
  nombreCompleto: z.string(),
  fechaNacimiento: z.iso.date().nullable(),
  email: z.string().nullable(),
  telefono: z.string().nullable(),
  domicilioCalle: z.string().nullable(),
  domicilioLocalidad: z.string().nullable(),
  domicilioProvincia: z.string().nullable(),
  domicilioCp: z.string().nullable(),
  requiereRevision: z.boolean(),
  activo: z.boolean(),
  creadoEn: z.iso.datetime(),
  actualizadoEn: z.iso.datetime(),
})

export class ClienteDto extends createZodDto(clienteSchema) {}

export const clienteListaSchema = z.object({
  items: z.array(clienteSchema),
  total: z.number().int(),
  pagina: z.number().int(),
  porPagina: z.number().int(),
})

export class ClienteListaDto extends createZodDto(clienteListaSchema) {}
