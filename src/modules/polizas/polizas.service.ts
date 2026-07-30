import { AseguradorasRepository } from '@/modules/aseguradoras/aseguradoras.repository'
import { ClientesRepository } from '@/modules/clientes/clientes.repository'
import { EntidadDuplicadaError, EntidadNoEncontradaError } from '@/common/errors'
import { AppConfigService } from '@/config/app-config.service'
import { Injectable } from '@nestjs/common'
import type { z } from 'zod'
import { mapearPoliza } from './polizas.mapper'
import type {
  DatosActualizarPolizaPersistencia,
  DatosCrearPolizaPersistencia,
  FiltrosListadoPolizas,
} from './polizas.repository'
import { PolizasRepository } from './polizas.repository'
import type { actualizarPolizaSchema } from './dto/actualizar-poliza.dto'
import type { crearPolizaSchema } from './dto/crear-poliza.dto'

const ENTIDAD = 'Poliza'

type DatosCrearPoliza = z.infer<typeof crearPolizaSchema>
type DatosActualizarPoliza = z.infer<typeof actualizarPolizaSchema>

@Injectable()
export class PolizasService {
  constructor(
    private readonly repositorio: PolizasRepository,
    private readonly aseguradorasRepositorio: AseguradorasRepository,
    private readonly clientesRepositorio: ClientesRepository,
    private readonly config: AppConfigService,
  ) {}

  async crear(datos: DatosCrearPoliza) {
    await this.validarAseguradoraExiste(datos.aseguradoraId)
    await this.validarClienteExiste(datos.clienteId)
    await this.validarClaveNaturalLibre(datos.aseguradoraId, datos.numeroPoliza, datos.numeroEndoso)

    const datosPersistencia: DatosCrearPolizaPersistencia = {
      aseguradoraId: datos.aseguradoraId,
      clienteId: datos.clienteId,
      numeroPoliza: datos.numeroPoliza,
      numeroEndoso: datos.numeroEndoso,
      estado: datos.estado,
      moneda: datos.moneda,
      // Carga manual: ramoId/productoId quedan NULL hasta que homologue el
      // motor. Regla 4 de CLAUDE.md.
      sinHomologar: true,
      ...(datos.ramoOrigen === undefined ? {} : { ramoOrigen: datos.ramoOrigen }),
      ...(datos.productoOrigen === undefined ? {} : { productoOrigen: datos.productoOrigen }),
      ...(datos.vigenciaDesde === undefined ? {} : { vigenciaDesde: new Date(datos.vigenciaDesde) }),
      ...(datos.vigenciaHasta === undefined ? {} : { vigenciaHasta: new Date(datos.vigenciaHasta) }),
      ...(datos.prima === undefined ? {} : { prima: datos.prima }),
      ...(datos.premio === undefined ? {} : { premio: datos.premio }),
      ...(datos.comisionPct === undefined ? {} : { comisionPct: datos.comisionPct }),
      ...(datos.formaPago === undefined ? {} : { formaPago: datos.formaPago }),
      ...(datos.productorCodigo === undefined ? {} : { productorCodigo: datos.productorCodigo }),
    }

    return this.mapear(await this.repositorio.crear(datosPersistencia))
  }

  async buscarPorId(id: string) {
    return this.mapear(await this.obtenerOFallar(id))
  }

  async listar(filtros: FiltrosListadoPolizas) {
    const { items, total } = await this.repositorio.listar(filtros)
    return {
      items: items.map((item) => this.mapear(item)),
      total,
      pagina: filtros.pagina,
      porPagina: filtros.porPagina,
    }
  }

  async actualizar(id: string, datos: DatosActualizarPoliza) {
    const existente = await this.obtenerOFallar(id)

    if (datos.clienteId !== undefined) {
      await this.validarClienteExiste(datos.clienteId)
    }

    if (datos.numeroPoliza !== undefined || datos.numeroEndoso !== undefined) {
      const numeroPoliza = datos.numeroPoliza ?? existente.numeroPoliza
      const numeroEndoso = datos.numeroEndoso ?? existente.numeroEndoso
      const otra = await this.repositorio.buscarPorClaveNatural(
        existente.aseguradoraId,
        numeroPoliza,
        numeroEndoso,
      )
      if (otra && otra.id !== id) {
        throw new EntidadDuplicadaError(ENTIDAD, 'numeroPoliza', `${numeroPoliza}/${numeroEndoso}`)
      }
    }

    const datosPersistencia: DatosActualizarPolizaPersistencia = {
      ...(datos.clienteId === undefined ? {} : { clienteId: datos.clienteId }),
      ...(datos.numeroPoliza === undefined ? {} : { numeroPoliza: datos.numeroPoliza }),
      ...(datos.numeroEndoso === undefined ? {} : { numeroEndoso: datos.numeroEndoso }),
      ...(datos.ramoOrigen === undefined ? {} : { ramoOrigen: datos.ramoOrigen }),
      ...(datos.productoOrigen === undefined ? {} : { productoOrigen: datos.productoOrigen }),
      ...(datos.vigenciaDesde === undefined ? {} : { vigenciaDesde: new Date(datos.vigenciaDesde) }),
      ...(datos.vigenciaHasta === undefined ? {} : { vigenciaHasta: new Date(datos.vigenciaHasta) }),
      ...(datos.estado === undefined ? {} : { estado: datos.estado }),
      ...(datos.prima === undefined ? {} : { prima: datos.prima }),
      ...(datos.premio === undefined ? {} : { premio: datos.premio }),
      ...(datos.comisionPct === undefined ? {} : { comisionPct: datos.comisionPct }),
      ...(datos.moneda === undefined ? {} : { moneda: datos.moneda }),
      ...(datos.formaPago === undefined ? {} : { formaPago: datos.formaPago }),
      ...(datos.productorCodigo === undefined ? {} : { productorCodigo: datos.productorCodigo }),
    }

    return this.mapear(await this.repositorio.actualizar(id, datosPersistencia))
  }

  async darDeBaja(id: string) {
    await this.obtenerOFallar(id)
    return this.mapear(await this.repositorio.marcarNoVigente(id))
  }

  private mapear(poliza: Parameters<typeof mapearPoliza>[0]) {
    return mapearPoliza(poliza, this.config.featureDatosFinancieros)
  }

  private async obtenerOFallar(id: string) {
    const poliza = await this.repositorio.buscarPorId(id)
    if (!poliza) {
      throw new EntidadNoEncontradaError(ENTIDAD, id)
    }
    return poliza
  }

  private async validarAseguradoraExiste(id: string) {
    const aseguradora = await this.aseguradorasRepositorio.buscarPorId(id)
    if (!aseguradora) {
      throw new EntidadNoEncontradaError('Aseguradora', id)
    }
  }

  private async validarClienteExiste(id: string) {
    const cliente = await this.clientesRepositorio.buscarPorId(id)
    if (!cliente) {
      throw new EntidadNoEncontradaError('Cliente', id)
    }
  }

  private async validarClaveNaturalLibre(
    aseguradoraId: string,
    numeroPoliza: string,
    numeroEndoso: string,
  ) {
    const existente = await this.repositorio.buscarPorClaveNatural(
      aseguradoraId,
      numeroPoliza,
      numeroEndoso,
    )
    if (existente) {
      throw new EntidadDuplicadaError(ENTIDAD, 'numeroPoliza', `${numeroPoliza}/${numeroEndoso}`)
    }
  }
}
