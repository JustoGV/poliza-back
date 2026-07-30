import { EntidadDuplicadaError, EntidadNoEncontradaError } from '@/common/errors'
import type { TipoPersona } from '@/generated/prisma/client'
import { Injectable } from '@nestjs/common'
import type { z } from 'zod'
import { mapearCliente } from './clientes.mapper'
import type {
  DatosActualizarClientePersistencia,
  DatosClientePersistencia,
  FiltrosListadoClientes,
} from './clientes.repository'
import { ClientesRepository } from './clientes.repository'
import type { actualizarClienteSchema } from './dto/actualizar-cliente.dto'
import type { crearClienteSchema } from './dto/crear-cliente.dto'

const ENTIDAD = 'Cliente'

type DatosCrearCliente = z.infer<typeof crearClienteSchema>
type DatosActualizarCliente = z.infer<typeof actualizarClienteSchema>

// razonSocial si es jurídica, si no "apellido, nombre" — ver comentario en
// prisma/schema.prisma sobre Cliente.nombreCompleto. Campo derivado, no se ingiere.
function calcularNombreCompleto(datos: {
  tipoPersona: TipoPersona
  apellido?: string | undefined
  nombre?: string | undefined
  razonSocial?: string | undefined
}): string {
  if (datos.tipoPersona === 'JURIDICA') {
    return datos.razonSocial ?? ''
  }
  return [datos.apellido, datos.nombre].filter(Boolean).join(', ')
}

@Injectable()
export class ClientesService {
  constructor(private readonly repositorio: ClientesRepository) {}

  async crear(datos: DatosCrearCliente) {
    if (datos.cuit !== undefined) {
      const existente = await this.repositorio.buscarPorCuit(datos.cuit)
      if (existente) {
        throw new EntidadDuplicadaError(ENTIDAD, 'cuit', datos.cuit)
      }
    }

    if (datos.tipoDocumento !== undefined && datos.nroDocumento !== undefined) {
      const existente = await this.repositorio.buscarPorDocumento(
        datos.tipoDocumento,
        datos.nroDocumento,
      )
      if (existente) {
        throw new EntidadDuplicadaError(ENTIDAD, 'nroDocumento', datos.nroDocumento)
      }
    }

    const datosPersistencia: DatosClientePersistencia = {
      ...datos,
      fechaNacimiento:
        datos.fechaNacimiento === undefined ? undefined : new Date(datos.fechaNacimiento),
      nombreCompleto: calcularNombreCompleto(datos),
      // Sin CUIT no hay clave de identidad confiable — a revisar a mano.
      requiereRevision: datos.cuit === undefined,
    }

    return mapearCliente(await this.repositorio.crear(datosPersistencia))
  }

  async buscarPorId(id: string) {
    return mapearCliente(await this.obtenerOFallar(id))
  }

  async listar(filtros: FiltrosListadoClientes) {
    const { items, total } = await this.repositorio.listar(filtros)
    return {
      items: items.map(mapearCliente),
      total,
      pagina: filtros.pagina,
      porPagina: filtros.porPagina,
    }
  }

  async actualizar(id: string, datos: DatosActualizarCliente) {
    const existente = await this.obtenerOFallar(id)

    if (datos.cuit !== undefined) {
      const otro = await this.repositorio.buscarPorCuit(datos.cuit)
      if (otro && otro.id !== id) {
        throw new EntidadDuplicadaError(ENTIDAD, 'cuit', datos.cuit)
      }
    }

    if (datos.tipoDocumento !== undefined && datos.nroDocumento !== undefined) {
      const otro = await this.repositorio.buscarPorDocumento(
        datos.tipoDocumento,
        datos.nroDocumento,
      )
      if (otro && otro.id !== id) {
        throw new EntidadDuplicadaError(ENTIDAD, 'nroDocumento', datos.nroDocumento)
      }
    }

    const tocaIdentidad =
      datos.tipoPersona !== undefined ||
      datos.apellido !== undefined ||
      datos.nombre !== undefined ||
      datos.razonSocial !== undefined

    const datosPersistencia: DatosActualizarClientePersistencia = {
      ...datos,
      fechaNacimiento:
        datos.fechaNacimiento === undefined ? undefined : new Date(datos.fechaNacimiento),
      ...(tocaIdentidad
        ? {
            // Fallback FISICA sólo pisa si el registro existente nunca tuvo
            // tipoPersona cargado (dato legado) — no debería darse en la práctica.
            nombreCompleto: calcularNombreCompleto({
              tipoPersona: datos.tipoPersona ?? existente.tipoPersona ?? 'FISICA',
              apellido: datos.apellido ?? existente.apellido ?? undefined,
              nombre: datos.nombre ?? existente.nombre ?? undefined,
              razonSocial: datos.razonSocial ?? existente.razonSocial ?? undefined,
            }),
          }
        : {}),
      ...(datos.cuit === undefined ? {} : { requiereRevision: false }),
    }

    return mapearCliente(await this.repositorio.actualizar(id, datosPersistencia))
  }

  async darDeBaja(id: string) {
    await this.obtenerOFallar(id)
    return mapearCliente(await this.repositorio.marcarInactivo(id))
  }

  private async obtenerOFallar(id: string) {
    const cliente = await this.repositorio.buscarPorId(id)
    if (!cliente) {
      throw new EntidadNoEncontradaError(ENTIDAD, id)
    }
    return cliente
  }
}
