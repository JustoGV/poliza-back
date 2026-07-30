import { EntidadDuplicadaError, EntidadNoEncontradaError } from '@/common/errors'
import type { Cliente } from '@/generated/prisma/client'
import type { ClientesRepository } from './clientes.repository'
import { ClientesService } from './clientes.service'

function crearClienteFila(overrides: Partial<Cliente> = {}): Cliente {
  return {
    id: 'cliente-1',
    tipoPersona: 'FISICA',
    cuit: '20304050607',
    tipoDocumento: 'DNI',
    nroDocumento: '30405060',
    apellido: 'Gomez',
    nombre: 'Ana',
    razonSocial: null,
    nombreCompleto: 'Gomez, Ana',
    fechaNacimiento: null,
    email: null,
    telefono: null,
    domicilioCalle: null,
    domicilioLocalidad: null,
    domicilioProvincia: null,
    domicilioCp: null,
    requiereRevision: false,
    activo: true,
    creadoEn: new Date(),
    actualizadoEn: new Date(),
    ...overrides,
  }
}

describe('ClientesService', () => {
  let repositorio: jest.Mocked<ClientesRepository>
  let service: ClientesService

  beforeEach(() => {
    repositorio = {
      crear: jest.fn(),
      buscarPorId: jest.fn(),
      buscarPorCuit: jest.fn(),
      buscarPorDocumento: jest.fn(),
      listar: jest.fn(),
      actualizar: jest.fn(),
      marcarInactivo: jest.fn(),
    } as unknown as jest.Mocked<ClientesRepository>

    service = new ClientesService(repositorio)
  })

  describe('crear', () => {
    it('arma nombreCompleto como "apellido, nombre" para FISICA', async () => {
      repositorio.buscarPorCuit.mockResolvedValue(null)
      repositorio.buscarPorDocumento.mockResolvedValue(null)
      repositorio.crear.mockResolvedValue(crearClienteFila())

      await service.crear({
        tipoPersona: 'FISICA',
        apellido: 'Gomez',
        nombre: 'Ana',
        cuit: '20304050607',
      })

      expect(repositorio.crear).toHaveBeenCalledWith(
        expect.objectContaining({ nombreCompleto: 'Gomez, Ana', requiereRevision: false }),
      )
    })

    it('usa razonSocial como nombreCompleto para JURIDICA', async () => {
      repositorio.buscarPorCuit.mockResolvedValue(null)
      repositorio.buscarPorDocumento.mockResolvedValue(null)
      repositorio.crear.mockResolvedValue(
        crearClienteFila({
          tipoPersona: 'JURIDICA',
          razonSocial: 'ACME SA',
          nombreCompleto: 'ACME SA',
        }),
      )

      await service.crear({ tipoPersona: 'JURIDICA', razonSocial: 'ACME SA' })

      expect(repositorio.crear).toHaveBeenCalledWith(
        expect.objectContaining({ nombreCompleto: 'ACME SA' }),
      )
    })

    it('marca requiereRevision=true si no llega cuit', async () => {
      repositorio.buscarPorDocumento.mockResolvedValue(null)
      repositorio.crear.mockResolvedValue(crearClienteFila({ cuit: null, requiereRevision: true }))

      await service.crear({ tipoPersona: 'FISICA', apellido: 'Gomez', nombre: 'Ana' })

      expect(repositorio.crear).toHaveBeenCalledWith(
        expect.objectContaining({ requiereRevision: true }),
      )
    })

    it('rechaza cuit duplicado', async () => {
      repositorio.buscarPorCuit.mockResolvedValue(crearClienteFila())

      await expect(
        service.crear({
          tipoPersona: 'FISICA',
          apellido: 'Gomez',
          nombre: 'Ana',
          cuit: '20304050607',
        }),
      ).rejects.toThrow(EntidadDuplicadaError)
    })
  })

  describe('actualizar', () => {
    it('recalcula nombreCompleto si cambia apellido', async () => {
      repositorio.buscarPorId.mockResolvedValue(crearClienteFila())
      repositorio.actualizar.mockResolvedValue(
        crearClienteFila({ apellido: 'Perez', nombreCompleto: 'Perez, Ana' }),
      )

      await service.actualizar('cliente-1', { apellido: 'Perez' })

      expect(repositorio.actualizar).toHaveBeenCalledWith(
        'cliente-1',
        expect.objectContaining({ nombreCompleto: 'Perez, Ana' }),
      )
    })

    it('lanza EntidadNoEncontradaError si no existe', async () => {
      repositorio.buscarPorId.mockResolvedValue(null)

      await expect(service.actualizar('nope', { nombre: 'X' })).rejects.toThrow(
        EntidadNoEncontradaError,
      )
    })
  })

  describe('darDeBaja', () => {
    it('marca inactivo', async () => {
      repositorio.buscarPorId.mockResolvedValue(crearClienteFila())
      repositorio.marcarInactivo.mockResolvedValue(crearClienteFila({ activo: false }))

      await service.darDeBaja('cliente-1')

      expect(repositorio.marcarInactivo).toHaveBeenCalledWith('cliente-1')
    })
  })
})
