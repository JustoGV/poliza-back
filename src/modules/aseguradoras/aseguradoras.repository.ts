import { Injectable } from '@nestjs/common'
import type { Prisma } from '@/generated/prisma/client'
import { PrismaService } from '@/prisma/prisma.service'

export interface FiltrosListadoAseguradoras {
  pagina: number
  porPagina: number
  // `| undefined` explícito: bajo exactOptionalPropertyTypes, `T | undefined`
  // (lo que infiere Zod para `.optional()`) y `campo?: T` (ausente) no son el
  // mismo tipo. Sin esto no compila lo que llega desde los DTO de Zod.
  activo?: boolean | undefined
  buscar?: string | undefined
}

export interface DatosCrearAseguradora {
  codigoInterno: string
  nombre: string
  cuit?: string | undefined
}

export interface DatosActualizarAseguradora {
  codigoInterno?: string | undefined
  nombre?: string | undefined
  cuit?: string | undefined
}

@Injectable()
export class AseguradorasRepository {
  constructor(private readonly prisma: PrismaService) {}

  crear(datos: DatosCrearAseguradora) {
    return this.prisma.aseguradora.create({
      data: {
        codigoInterno: datos.codigoInterno,
        nombre: datos.nombre,
        // Spread condicional: si `cuit` es undefined la clave queda AUSENTE,
        // no presente-con-undefined — es lo que exige el tipo de Prisma
        // (`cuit?: string | null`) bajo exactOptionalPropertyTypes.
        ...(datos.cuit === undefined ? {} : { cuit: datos.cuit }),
      },
    })
  }

  buscarPorId(id: string) {
    return this.prisma.aseguradora.findUnique({ where: { id } })
  }

  buscarPorCodigo(codigoInterno: string) {
    return this.prisma.aseguradora.findUnique({ where: { codigoInterno } })
  }

  async listar(filtros: FiltrosListadoAseguradoras) {
    const where: Prisma.AseguradoraWhereInput = {
      ...(filtros.activo === undefined ? {} : { activo: filtros.activo }),
      ...(filtros.buscar === undefined
        ? {}
        : {
            OR: [
              { nombre: { contains: filtros.buscar, mode: 'insensitive' } },
              { codigoInterno: { contains: filtros.buscar, mode: 'insensitive' } },
            ],
          }),
    }

    const [items, total] = await Promise.all([
      this.prisma.aseguradora.findMany({
        where,
        skip: (filtros.pagina - 1) * filtros.porPagina,
        take: filtros.porPagina,
        orderBy: { nombre: 'asc' },
      }),
      this.prisma.aseguradora.count({ where }),
    ])

    return { items, total }
  }

  actualizar(id: string, datos: DatosActualizarAseguradora) {
    return this.prisma.aseguradora.update({
      where: { id },
      data: {
        ...(datos.codigoInterno === undefined ? {} : { codigoInterno: datos.codigoInterno }),
        ...(datos.nombre === undefined ? {} : { nombre: datos.nombre }),
        ...(datos.cuit === undefined ? {} : { cuit: datos.cuit }),
      },
    })
  }

  marcarInactiva(id: string) {
    return this.prisma.aseguradora.update({ where: { id }, data: { activo: false } })
  }
}
