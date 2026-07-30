import type { Cliente } from '@/generated/prisma/client'
import type { z } from 'zod'
import type { clienteSchema } from './dto/cliente.dto'

export function mapearCliente(cliente: Cliente): z.infer<typeof clienteSchema> {
  return {
    id: cliente.id,
    tipoPersona: cliente.tipoPersona,
    cuit: cliente.cuit,
    tipoDocumento: cliente.tipoDocumento,
    nroDocumento: cliente.nroDocumento,
    apellido: cliente.apellido,
    nombre: cliente.nombre,
    razonSocial: cliente.razonSocial,
    nombreCompleto: cliente.nombreCompleto,
    fechaNacimiento: cliente.fechaNacimiento
      ? cliente.fechaNacimiento.toISOString().slice(0, 10)
      : null,
    email: cliente.email,
    telefono: cliente.telefono,
    domicilioCalle: cliente.domicilioCalle,
    domicilioLocalidad: cliente.domicilioLocalidad,
    domicilioProvincia: cliente.domicilioProvincia,
    domicilioCp: cliente.domicilioCp,
    requiereRevision: cliente.requiereRevision,
    activo: cliente.activo,
    creadoEn: cliente.creadoEn.toISOString(),
    actualizadoEn: cliente.actualizadoEn.toISOString(),
  }
}
