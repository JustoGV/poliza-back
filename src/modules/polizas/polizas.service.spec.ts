import { EntidadDuplicadaError, EntidadNoEncontradaError } from '@/common/errors'
import type { AppConfigService } from '@/config/app-config.service'
import type { Aseguradora, Cliente, Poliza } from '@/generated/prisma/client'
import type { AseguradorasRepository } from '@/modules/aseguradoras/aseguradoras.repository'
import type { ClientesRepository } from '@/modules/clientes/clientes.repository'
import type { PolizasRepository } from './polizas.repository'
import { PolizasService } from './polizas.service'

function crearPolizaFila(overrides: Partial<Poliza> = {}): Poliza {
  return {
    id: 'poliza-1',
    aseguradoraId: 'aseguradora-1',
    clienteId: 'cliente-1',
    numeroPoliza: '1240112',
    numeroEndoso: '0',
    ramoId: null,
    productoId: null,
    ramoOrigen: null,
    productoOrigen: null,
    vigenciaDesde: null,
    vigenciaHasta: null,
    estado: 'VIGENTE',
    estadoOrigen: null,
    prima: null,
    premio: null,
    comisionPct: null,
    moneda: 'ARS',
    formaPago: null,
    productorCodigo: null,
    sinHomologar: true,
    posibleBaja: false,
    rawSource: null,
    importacionId: null,
    creadoEn: new Date('2026-01-01T00:00:00Z'),
    actualizadoEn: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  }
}

describe('PolizasService', () => {
  let repositorio: jest.Mocked<PolizasRepository>
  let aseguradorasRepositorio: jest.Mocked<AseguradorasRepository>
  let clientesRepositorio: jest.Mocked<ClientesRepository>
  let config: AppConfigService
  let service: PolizasService

  beforeEach(() => {
    repositorio = {
      crear: jest.fn(),
      buscarPorId: jest.fn(),
      buscarPorClaveNatural: jest.fn(),
      listar: jest.fn(),
      actualizar: jest.fn(),
      marcarNoVigente: jest.fn(),
    } as unknown as jest.Mocked<PolizasRepository>

    aseguradorasRepositorio = {
      buscarPorId: jest.fn(),
    } as unknown as jest.Mocked<AseguradorasRepository>

    clientesRepositorio = {
      buscarPorId: jest.fn(),
    } as unknown as jest.Mocked<ClientesRepository>

    config = { featureDatosFinancieros: false } as AppConfigService

    service = new PolizasService(repositorio, aseguradorasRepositorio, clientesRepositorio, config)
  })

  describe('crear', () => {
    const datosBase = {
      aseguradoraId: 'aseguradora-1',
      clienteId: 'cliente-1',
      numeroPoliza: '1240112',
      numeroEndoso: '0',
      estado: 'VIGENTE' as const,
      moneda: 'ARS',
    }

    it('rechaza si la aseguradora no existe', async () => {
      aseguradorasRepositorio.buscarPorId.mockResolvedValue(null)

      await expect(service.crear(datosBase)).rejects.toThrow(EntidadNoEncontradaError)
      expect(clientesRepositorio.buscarPorId).not.toHaveBeenCalled()
    })

    it('rechaza si el cliente no existe', async () => {
      aseguradorasRepositorio.buscarPorId.mockResolvedValue({} as Aseguradora)
      clientesRepositorio.buscarPorId.mockResolvedValue(null)

      await expect(service.crear(datosBase)).rejects.toThrow(EntidadNoEncontradaError)
    })

    it('rechaza clave natural (aseguradora + numero + endoso) duplicada', async () => {
      aseguradorasRepositorio.buscarPorId.mockResolvedValue({} as Aseguradora)
      clientesRepositorio.buscarPorId.mockResolvedValue({} as Cliente)
      repositorio.buscarPorClaveNatural.mockResolvedValue(crearPolizaFila())

      await expect(service.crear(datosBase)).rejects.toThrow(EntidadDuplicadaError)
    })

    it('crea con sinHomologar=true — ramoId/productoId no se asignan a mano', async () => {
      aseguradorasRepositorio.buscarPorId.mockResolvedValue({} as Aseguradora)
      clientesRepositorio.buscarPorId.mockResolvedValue({} as Cliente)
      repositorio.buscarPorClaveNatural.mockResolvedValue(null)
      repositorio.crear.mockResolvedValue(crearPolizaFila())

      await service.crear(datosBase)

      expect(repositorio.crear).toHaveBeenCalledWith(
        expect.objectContaining({ sinHomologar: true }),
      )
    })

    it('endoso 0 no rompe la unicidad frente a otra aseguradora', async () => {
      aseguradorasRepositorio.buscarPorId.mockResolvedValue({} as Aseguradora)
      clientesRepositorio.buscarPorId.mockResolvedValue({} as Cliente)
      repositorio.buscarPorClaveNatural.mockResolvedValue(null)
      repositorio.crear.mockResolvedValue(crearPolizaFila())

      await service.crear(datosBase)

      expect(repositorio.buscarPorClaveNatural).toHaveBeenCalledWith(
        'aseguradora-1',
        '1240112',
        '0',
      )
    })
  })

  describe('actualizar', () => {
    it('lanza EntidadNoEncontradaError si no existe', async () => {
      repositorio.buscarPorId.mockResolvedValue(null)

      await expect(service.actualizar('nope', { numeroPoliza: 'X' })).rejects.toThrow(
        EntidadNoEncontradaError,
      )
    })

    it('rechaza si el nuevo numeroPoliza/numeroEndoso colisiona con otra poliza', async () => {
      repositorio.buscarPorId.mockResolvedValue(crearPolizaFila())
      repositorio.buscarPorClaveNatural.mockResolvedValue(crearPolizaFila({ id: 'otra-poliza' }))

      await expect(service.actualizar('poliza-1', { numeroPoliza: '999' })).rejects.toThrow(
        EntidadDuplicadaError,
      )
    })

    it('permite reafirmar el mismo numeroPoliza sin chocar consigo misma', async () => {
      repositorio.buscarPorId.mockResolvedValue(crearPolizaFila())
      repositorio.buscarPorClaveNatural.mockResolvedValue(crearPolizaFila())
      repositorio.actualizar.mockResolvedValue(crearPolizaFila())

      await service.actualizar('poliza-1', { numeroPoliza: '1240112' })

      expect(repositorio.actualizar).toHaveBeenCalled()
    })
  })

  describe('darDeBaja', () => {
    it('marca NO_VIGENTE en vez de borrar', async () => {
      repositorio.buscarPorId.mockResolvedValue(crearPolizaFila())
      repositorio.marcarNoVigente.mockResolvedValue(crearPolizaFila({ estado: 'NO_VIGENTE' }))

      await service.darDeBaja('poliza-1')

      expect(repositorio.marcarNoVigente).toHaveBeenCalledWith('poliza-1')
    })
  })
})
