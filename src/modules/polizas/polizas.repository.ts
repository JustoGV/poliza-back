import type { EstadoPoliza, Prisma } from '@/generated/prisma/client'
import { PrismaService } from '@/prisma/prisma.service'
import { Injectable } from '@nestjs/common'

export interface FiltrosListadoPolizas {
  pagina: number
  porPagina: number
  aseguradoraId?: string | undefined
  clienteId?: string | undefined
  estado?: EstadoPoliza | undefined
  sinHomologar?: boolean | undefined
  posibleBaja?: boolean | undefined
  buscar?: string | undefined
}

export interface DatosCrearPolizaPersistencia {
  aseguradoraId: string
  clienteId: string
  numeroPoliza: string
  numeroEndoso: string
  ramoOrigen?: string | undefined
  productoOrigen?: string | undefined
  vigenciaDesde?: Date | undefined
  vigenciaHasta?: Date | undefined
  estado: EstadoPoliza
  prima?: string | undefined
  premio?: string | undefined
  comisionPct?: string | undefined
  moneda: string
  formaPago?: string | undefined
  productorCodigo?: string | undefined
  // true siempre en carga manual: ramoId/productoId sólo los asigna el motor
  // de homologación (F4-19).
  sinHomologar: boolean
}

export type DatosActualizarPolizaPersistencia = Partial<
  Omit<DatosCrearPolizaPersistencia, 'aseguradoraId' | 'sinHomologar'>
>

function construirCamposOpcionales(datos: DatosActualizarPolizaPersistencia) {
  return {
    ...(datos.clienteId === undefined ? {} : { clienteId: datos.clienteId }),
    ...(datos.numeroPoliza === undefined ? {} : { numeroPoliza: datos.numeroPoliza }),
    ...(datos.numeroEndoso === undefined ? {} : { numeroEndoso: datos.numeroEndoso }),
    ...(datos.ramoOrigen === undefined ? {} : { ramoOrigen: datos.ramoOrigen }),
    ...(datos.productoOrigen === undefined ? {} : { productoOrigen: datos.productoOrigen }),
    ...(datos.vigenciaDesde === undefined ? {} : { vigenciaDesde: datos.vigenciaDesde }),
    ...(datos.vigenciaHasta === undefined ? {} : { vigenciaHasta: datos.vigenciaHasta }),
    ...(datos.estado === undefined ? {} : { estado: datos.estado }),
    ...(datos.prima === undefined ? {} : { prima: datos.prima }),
    ...(datos.premio === undefined ? {} : { premio: datos.premio }),
    ...(datos.comisionPct === undefined ? {} : { comisionPct: datos.comisionPct }),
    ...(datos.moneda === undefined ? {} : { moneda: datos.moneda }),
    ...(datos.formaPago === undefined ? {} : { formaPago: datos.formaPago }),
    ...(datos.productorCodigo === undefined ? {} : { productorCodigo: datos.productorCodigo }),
  }
}

@Injectable()
export class PolizasRepository {
  constructor(private readonly prisma: PrismaService) {}

  crear(datos: DatosCrearPolizaPersistencia) {
    return this.prisma.poliza.create({
      data: {
        aseguradoraId: datos.aseguradoraId,
        clienteId: datos.clienteId,
        numeroPoliza: datos.numeroPoliza,
        numeroEndoso: datos.numeroEndoso,
        estado: datos.estado,
        moneda: datos.moneda,
        sinHomologar: datos.sinHomologar,
        ...construirCamposOpcionales(datos),
      },
    })
  }

  buscarPorId(id: string) {
    return this.prisma.poliza.findUnique({ where: { id } })
  }

  buscarPorClaveNatural(aseguradoraId: string, numeroPoliza: string, numeroEndoso: string) {
    return this.prisma.poliza.findUnique({
      where: {
        aseguradoraId_numeroPoliza_numeroEndoso: { aseguradoraId, numeroPoliza, numeroEndoso },
      },
    })
  }

  async listar(filtros: FiltrosListadoPolizas) {
    const where: Prisma.PolizaWhereInput = {
      ...(filtros.aseguradoraId === undefined ? {} : { aseguradoraId: filtros.aseguradoraId }),
      ...(filtros.clienteId === undefined ? {} : { clienteId: filtros.clienteId }),
      ...(filtros.estado === undefined ? {} : { estado: filtros.estado }),
      ...(filtros.sinHomologar === undefined ? {} : { sinHomologar: filtros.sinHomologar }),
      ...(filtros.posibleBaja === undefined ? {} : { posibleBaja: filtros.posibleBaja }),
      ...(filtros.buscar === undefined
        ? {}
        : { numeroPoliza: { contains: filtros.buscar, mode: 'insensitive' } }),
    }

    const [items, total] = await Promise.all([
      this.prisma.poliza.findMany({
        where,
        skip: (filtros.pagina - 1) * filtros.porPagina,
        take: filtros.porPagina,
        orderBy: { creadoEn: 'desc' },
      }),
      this.prisma.poliza.count({ where }),
    ])

    return { items, total }
  }

  actualizar(id: string, datos: DatosActualizarPolizaPersistencia) {
    return this.prisma.poliza.update({
      where: { id },
      data: construirCamposOpcionales(datos),
    })
  }

  marcarNoVigente(id: string) {
    return this.prisma.poliza.update({ where: { id }, data: { estado: 'NO_VIGENTE' } })
  }
}
