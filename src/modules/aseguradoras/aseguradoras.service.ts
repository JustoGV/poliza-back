import { Injectable } from '@nestjs/common'
import { EntidadDuplicadaError, EntidadNoEncontradaError } from '@/common/errors'
import { mapearAseguradora } from './aseguradoras.mapper'
import type {
  DatosActualizarAseguradora,
  DatosCrearAseguradora,
  FiltrosListadoAseguradoras,
} from './aseguradoras.repository'
import { AseguradorasRepository } from './aseguradoras.repository'

const ENTIDAD = 'Aseguradora'

@Injectable()
export class AseguradorasService {
  constructor(private readonly repositorio: AseguradorasRepository) {}

  async crear(datos: DatosCrearAseguradora) {
    const existente = await this.repositorio.buscarPorCodigo(datos.codigoInterno)
    if (existente) {
      throw new EntidadDuplicadaError(ENTIDAD, 'codigoInterno', datos.codigoInterno)
    }
    return mapearAseguradora(await this.repositorio.crear(datos))
  }

  async buscarPorId(id: string) {
    return mapearAseguradora(await this.obtenerOFallar(id))
  }

  async listar(filtros: FiltrosListadoAseguradoras) {
    const { items, total } = await this.repositorio.listar(filtros)
    return {
      items: items.map(mapearAseguradora),
      total,
      pagina: filtros.pagina,
      porPagina: filtros.porPagina,
    }
  }

  async actualizar(id: string, datos: DatosActualizarAseguradora) {
    // Dispara EntidadNoEncontradaError si no existe — no seguir de largo.
    await this.obtenerOFallar(id)

    if (datos.codigoInterno !== undefined) {
      const existente = await this.repositorio.buscarPorCodigo(datos.codigoInterno)
      if (existente && existente.id !== id) {
        throw new EntidadDuplicadaError(ENTIDAD, 'codigoInterno', datos.codigoInterno)
      }
    }

    return mapearAseguradora(await this.repositorio.actualizar(id, datos))
  }

  async darDeBaja(id: string) {
    await this.obtenerOFallar(id)
    return mapearAseguradora(await this.repositorio.marcarInactiva(id))
  }

  private async obtenerOFallar(id: string) {
    const aseguradora = await this.repositorio.buscarPorId(id)
    if (!aseguradora) {
      throw new EntidadNoEncontradaError(ENTIDAD, id)
    }
    return aseguradora
  }
}
