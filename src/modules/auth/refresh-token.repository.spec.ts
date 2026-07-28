import type { PrismaService } from '@/prisma/prisma.service'
import { RefreshTokenRepository } from './refresh-token.repository'

describe('RefreshTokenRepository', () => {
  function crearPrisma() {
    return {
      refreshToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    } as unknown as PrismaService & {
      refreshToken: {
        create: jest.Mock
        findUnique: jest.Mock
        update: jest.Mock
        updateMany: jest.Mock
      }
    }
  }

  it('crear() inserta con los datos recibidos', () => {
    const prisma = crearPrisma()
    const repo = new RefreshTokenRepository(prisma)
    const datos = { usuarioId: 'u1', tokenHash: 'hash', familiaId: 'f1', expiraEn: new Date() }

    void repo.crear(datos)

    expect(prisma.refreshToken.create).toHaveBeenCalledWith({ data: datos })
  })

  it('buscarPorHash() busca por tokenHash', () => {
    const prisma = crearPrisma()
    const repo = new RefreshTokenRepository(prisma)

    void repo.buscarPorHash('hash-x')

    expect(prisma.refreshToken.findUnique).toHaveBeenCalledWith({ where: { tokenHash: 'hash-x' } })
  })

  it('marcarRevocado() actualiza revocado=true por id', () => {
    const prisma = crearPrisma()
    const repo = new RefreshTokenRepository(prisma)

    void repo.marcarRevocado('rt-1')

    expect(prisma.refreshToken.update).toHaveBeenCalledWith({
      where: { id: 'rt-1' },
      data: { revocado: true },
    })
  })

  it('revocarFamilia() actualiza todos los no revocados de la familia', () => {
    const prisma = crearPrisma()
    const repo = new RefreshTokenRepository(prisma)

    void repo.revocarFamilia('familia-1')

    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { familiaId: 'familia-1', revocado: false },
      data: { revocado: true },
    })
  })
})
