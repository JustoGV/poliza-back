import type { Prisma, TipoDocumento, TipoPersona } from '@/generated/prisma/client'
import { PrismaService } from '@/prisma/prisma.service'
import { Injectable } from '@nestjs/common'

export interface FiltrosListadoClientes {
  pagina: number
  porPagina: number
  activo?: boolean | undefined
  requiereRevision?: boolean | undefined
  buscar?: string | undefined
}

export interface DatosClientePersistencia {
  tipoPersona?: TipoPersona | undefined
  cuit?: string | undefined
  tipoDocumento?: TipoDocumento | undefined
  nroDocumento?: string | undefined
  apellido?: string | undefined
  nombre?: string | undefined
  razonSocial?: string | undefined
  nombreCompleto: string
  fechaNacimiento?: Date | undefined
  email?: string | undefined
  telefono?: string | undefined
  domicilioCalle?: string | undefined
  domicilioLocalidad?: string | undefined
  domicilioProvincia?: string | undefined
  domicilioCp?: string | undefined
  requiereRevision: boolean
}

export type DatosActualizarClientePersistencia = Partial<DatosClientePersistencia>

function construirCamposOpcionales(datos: Partial<DatosClientePersistencia>) {
  return {
    ...(datos.tipoPersona === undefined ? {} : { tipoPersona: datos.tipoPersona }),
    ...(datos.cuit === undefined ? {} : { cuit: datos.cuit }),
    ...(datos.tipoDocumento === undefined ? {} : { tipoDocumento: datos.tipoDocumento }),
    ...(datos.nroDocumento === undefined ? {} : { nroDocumento: datos.nroDocumento }),
    ...(datos.apellido === undefined ? {} : { apellido: datos.apellido }),
    ...(datos.nombre === undefined ? {} : { nombre: datos.nombre }),
    ...(datos.razonSocial === undefined ? {} : { razonSocial: datos.razonSocial }),
    ...(datos.fechaNacimiento === undefined ? {} : { fechaNacimiento: datos.fechaNacimiento }),
    ...(datos.email === undefined ? {} : { email: datos.email }),
    ...(datos.telefono === undefined ? {} : { telefono: datos.telefono }),
    ...(datos.domicilioCalle === undefined ? {} : { domicilioCalle: datos.domicilioCalle }),
    ...(datos.domicilioLocalidad === undefined
      ? {}
      : { domicilioLocalidad: datos.domicilioLocalidad }),
    ...(datos.domicilioProvincia === undefined
      ? {}
      : { domicilioProvincia: datos.domicilioProvincia }),
    ...(datos.domicilioCp === undefined ? {} : { domicilioCp: datos.domicilioCp }),
  }
}

@Injectable()
export class ClientesRepository {
  constructor(private readonly prisma: PrismaService) {}

  crear(datos: DatosClientePersistencia) {
    return this.prisma.cliente.create({
      data: {
        nombreCompleto: datos.nombreCompleto,
        requiereRevision: datos.requiereRevision,
        ...construirCamposOpcionales(datos),
      },
    })
  }

  buscarPorId(id: string) {
    return this.prisma.cliente.findUnique({ where: { id } })
  }

  buscarPorCuit(cuit: string) {
    return this.prisma.cliente.findUnique({ where: { cuit } })
  }

  buscarPorDocumento(tipoDocumento: TipoDocumento, nroDocumento: string) {
    return this.prisma.cliente.findUnique({
      where: { tipoDocumento_nroDocumento: { tipoDocumento, nroDocumento } },
    })
  }

  async listar(filtros: FiltrosListadoClientes) {
    const where: Prisma.ClienteWhereInput = {
      ...(filtros.activo === undefined ? {} : { activo: filtros.activo }),
      ...(filtros.requiereRevision === undefined
        ? {}
        : { requiereRevision: filtros.requiereRevision }),
      ...(filtros.buscar === undefined
        ? {}
        : {
            OR: [
              { nombreCompleto: { contains: filtros.buscar, mode: 'insensitive' } },
              { cuit: { contains: filtros.buscar, mode: 'insensitive' } },
              { nroDocumento: { contains: filtros.buscar, mode: 'insensitive' } },
            ],
          }),
    }

    const [items, total] = await Promise.all([
      this.prisma.cliente.findMany({
        where,
        skip: (filtros.pagina - 1) * filtros.porPagina,
        take: filtros.porPagina,
        orderBy: { nombreCompleto: 'asc' },
      }),
      this.prisma.cliente.count({ where }),
    ])

    return { items, total }
  }

  actualizar(id: string, datos: DatosActualizarClientePersistencia) {
    return this.prisma.cliente.update({
      where: { id },
      data: {
        ...(datos.nombreCompleto === undefined ? {} : { nombreCompleto: datos.nombreCompleto }),
        ...(datos.requiereRevision === undefined
          ? {}
          : { requiereRevision: datos.requiereRevision }),
        ...construirCamposOpcionales(datos),
      },
    })
  }

  marcarInactivo(id: string) {
    return this.prisma.cliente.update({ where: { id }, data: { activo: false } })
  }
}
