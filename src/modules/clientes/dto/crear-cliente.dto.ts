import { createZodDto } from 'nestjs-zod'
import z from 'zod'

export const clienteBaseSchema = z.object({
  tipoPersona: z.enum(['FISICA', 'JURIDICA']),
  cuit: z
    .string()
    .trim()
    .regex(/^\d{11}$/, 'CUIT debe tener 11 digitos sin guiones')
    .optional(),
  tipoDocumento: z.enum(['DNI', 'LE', 'LC', 'CI', 'PASAPORTE', 'CUIT', 'CUIL']).optional(),
  nroDocumento: z.string().trim().min(1).max(20).optional(),
  apellido: z.string().trim().min(1).max(120).optional(),
  nombre: z.string().trim().min(1).max(120).optional(),
  razonSocial: z.string().trim().min(1).max(200).optional(),
  fechaNacimiento: z.iso.date().optional(),
  email: z.email().trim().max(200).optional(),
  telefono: z.string().trim().min(1).max(50).optional(),
  domicilioCalle: z.string().trim().max(200).optional(),
  domicilioLocalidad: z.string().trim().max(120).optional(),
  domicilioProvincia: z.string().trim().max(80).optional(),
  domicilioCp: z.string().trim().max(12).optional(),
})

export function validarParDocumento(
  datos: { tipoDocumento?: string | undefined; nroDocumento?: string | undefined },
  ctx: z.RefinementCtx,
) {
  if ((datos.tipoDocumento === undefined) !== (datos.nroDocumento === undefined)) {
    ctx.addIssue({
      code: 'custom',
      message: 'tipoDocumento y nroDocumento van juntos o ninguno',
      path: ['nroDocumento'],
    })
  }
}

export const crearClienteSchema = clienteBaseSchema.superRefine((datos, ctx) => {
  validarParDocumento(datos, ctx)

  if (datos.tipoPersona === 'FISICA' && (!datos.apellido || !datos.nombre)) {
    ctx.addIssue({
      code: 'custom',
      message: 'Persona física requiere apellido y nombre',
      path: ['apellido'],
    })
  }

  if (datos.tipoPersona === 'JURIDICA' && !datos.razonSocial) {
    ctx.addIssue({
      code: 'custom',
      message: 'Persona jurídica requiere razón social',
      path: ['razonSocial'],
    })
  }
})

export class CrearClienteDto extends createZodDto(crearClienteSchema) {}
