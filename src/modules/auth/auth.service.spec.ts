import type { JwtService } from '@nestjs/jwt'
import { Argon2Hasher } from '@/common/hashing/argon2-hasher.service'
import { CredencialesInvalidasError, SesionInvalidaError } from '@/common/errors'
import type { AppConfigService } from '@/config/app-config.service'
import type { RefreshToken, Usuario } from '@/generated/prisma/client'
import type { AuditoriaRepository } from '../auditoria/auditoria.repository'
import type { UsuariosRepository } from '../usuarios/usuarios.repository'
import { AuthService } from './auth.service'
import type { RefreshTokenRepository } from './refresh-token.repository'

function crearUsuario(overrides: Partial<Usuario> = {}): Usuario {
  return {
    id: 'usuario-1',
    email: 'ana@mfseguros.com.ar',
    passwordHash: 'hash-guardado',
    nombre: 'Ana',
    rol: 'OPERADOR',
    activo: true,
    ultimoLoginEn: null,
    creadoEn: new Date(),
    actualizadoEn: new Date(),
    ...overrides,
  }
}

function crearFilaRefresh(overrides: Partial<RefreshToken> = {}): RefreshToken {
  return {
    id: 'rt-1',
    usuarioId: 'usuario-1',
    tokenHash: 'hash-token',
    familiaId: 'familia-1',
    revocado: false,
    expiraEn: new Date(Date.now() + 60_000),
    creadoEn: new Date(),
    ...overrides,
  }
}

describe('AuthService', () => {
  let usuarios: jest.Mocked<UsuariosRepository>
  let refreshTokens: jest.Mocked<RefreshTokenRepository>
  let auditoria: jest.Mocked<AuditoriaRepository>
  let jwt: jest.Mocked<JwtService>
  let hasher: Argon2Hasher
  let config: AppConfigService
  let service: AuthService

  beforeEach(() => {
    usuarios = {
      buscarPorEmail: jest.fn(),
      buscarPorId: jest.fn(),
      actualizarUltimoLogin: jest.fn(),
    } as unknown as jest.Mocked<UsuariosRepository>

    refreshTokens = {
      crear: jest.fn(),
      buscarPorHash: jest.fn(),
      marcarRevocado: jest.fn(),
      revocarFamilia: jest.fn(),
    } as unknown as jest.Mocked<RefreshTokenRepository>

    auditoria = { registrar: jest.fn() } as unknown as jest.Mocked<AuditoriaRepository>

    jwt = { signAsync: jest.fn().mockResolvedValue('access-token-firmado') } as unknown as jest.Mocked<JwtService>

    // Argon2 real: probar el flujo completo (no mockear la verificación) es
    // lo único que prueba de verdad la defensa contra timing attack del login.
    hasher = new Argon2Hasher()

    config = { jwtRefreshTtl: '7d' } as unknown as AppConfigService

    service = new AuthService(usuarios, refreshTokens, auditoria, jwt, hasher, config)
  })

  describe('login', () => {
    it('rechaza un email inexistente con el mismo error genérico', async () => {
      usuarios.buscarPorEmail.mockResolvedValue(null)

      await expect(service.login('no-existe@mfseguros.com.ar', 'cualquiera', {})).rejects.toThrow(
        CredencialesInvalidasError,
      )
      expect(auditoria.registrar).toHaveBeenCalledWith(
        expect.objectContaining({ accion: 'LOGIN_FALLIDO', entidadTipo: 'usuario' }),
      )
    })

    it('rechaza una contraseña incorrecta', async () => {
      const hashReal = await hasher.hash('LaClaveCorrecta1!')
      usuarios.buscarPorEmail.mockResolvedValue(crearUsuario({ passwordHash: hashReal }))

      await expect(
        service.login('ana@mfseguros.com.ar', 'otra-clave', { ip: '10.0.0.1', userAgent: 'curl' }),
      ).rejects.toThrow(CredencialesInvalidasError)
      expect(auditoria.registrar).toHaveBeenCalledWith(
        expect.objectContaining({
          accion: 'LOGIN_FALLIDO',
          usuarioId: 'usuario-1',
          entidadId: 'usuario-1',
          ip: '10.0.0.1',
          userAgent: 'curl',
        }),
      )
    })

    it('rechaza un usuario inactivo aunque la contraseña sea correcta', async () => {
      const hashReal = await hasher.hash('LaClaveCorrecta1!')
      usuarios.buscarPorEmail.mockResolvedValue(crearUsuario({ passwordHash: hashReal, activo: false }))

      await expect(service.login('ana@mfseguros.com.ar', 'LaClaveCorrecta1!', {})).rejects.toThrow(
        CredencialesInvalidasError,
      )
    })

    it('devuelve access y refresh token ante credenciales válidas', async () => {
      const hashReal = await hasher.hash('LaClaveCorrecta1!')
      usuarios.buscarPorEmail.mockResolvedValue(crearUsuario({ passwordHash: hashReal }))

      const resultado = await service.login('ana@mfseguros.com.ar', 'LaClaveCorrecta1!', {
        ip: '127.0.0.1',
        userAgent: 'jest',
      })

      expect(resultado.accessToken).toBe('access-token-firmado')
      expect(resultado.refreshTokenCrudo).toEqual(expect.any(String))
      expect(usuarios.actualizarUltimoLogin).toHaveBeenCalledWith('usuario-1')
      expect(auditoria.registrar).toHaveBeenCalledWith(expect.objectContaining({ accion: 'LOGIN' }))
      expect(refreshTokens.crear).toHaveBeenCalledWith(
        expect.objectContaining({ usuarioId: 'usuario-1' }),
      )
    })

    it('funciona sin ip ni userAgent en el contexto (ninguno es obligatorio)', async () => {
      const hashReal = await hasher.hash('LaClaveCorrecta1!')
      usuarios.buscarPorEmail.mockResolvedValue(crearUsuario({ passwordHash: hashReal }))

      const resultado = await service.login('ana@mfseguros.com.ar', 'LaClaveCorrecta1!', {})

      expect(resultado.accessToken).toBe('access-token-firmado')
      expect(auditoria.registrar).toHaveBeenCalledWith(
        expect.not.objectContaining({ ip: expect.anything(), userAgent: expect.anything() }),
      )
    })
  })

  describe('refrescar', () => {
    it('rechaza un token que no existe', async () => {
      refreshTokens.buscarPorHash.mockResolvedValue(null)
      await expect(service.refrescar('token-desconocido')).rejects.toThrow(SesionInvalidaError)
    })

    it('detecta reuso, revoca la familia entera y rechaza', async () => {
      refreshTokens.buscarPorHash.mockResolvedValue(crearFilaRefresh({ revocado: true }))

      await expect(service.refrescar('token-ya-rotado')).rejects.toThrow(SesionInvalidaError)
      expect(refreshTokens.revocarFamilia).toHaveBeenCalledWith('familia-1')
    })

    it('rechaza un token vencido', async () => {
      refreshTokens.buscarPorHash.mockResolvedValue(
        crearFilaRefresh({ expiraEn: new Date(Date.now() - 1000) }),
      )
      await expect(service.refrescar('token-vencido')).rejects.toThrow(SesionInvalidaError)
    })

    it('revoca la familia si el usuario fue dado de baja', async () => {
      refreshTokens.buscarPorHash.mockResolvedValue(crearFilaRefresh())
      usuarios.buscarPorId.mockResolvedValue(crearUsuario({ activo: false }))

      await expect(service.refrescar('token-valido')).rejects.toThrow(SesionInvalidaError)
      expect(refreshTokens.revocarFamilia).toHaveBeenCalledWith('familia-1')
    })

    it('rota el token: revoca el actual y emite uno nuevo de la misma familia', async () => {
      refreshTokens.buscarPorHash.mockResolvedValue(crearFilaRefresh())
      usuarios.buscarPorId.mockResolvedValue(crearUsuario())

      const resultado = await service.refrescar('token-valido')

      expect(refreshTokens.marcarRevocado).toHaveBeenCalledWith('rt-1')
      expect(refreshTokens.crear).toHaveBeenCalledWith(
        expect.objectContaining({ usuarioId: 'usuario-1', familiaId: 'familia-1' }),
      )
      expect(resultado.accessToken).toBe('access-token-firmado')
    })
  })

  describe('logout', () => {
    it('revoca la familia cuando el token existe', async () => {
      refreshTokens.buscarPorHash.mockResolvedValue(crearFilaRefresh())
      await service.logout('token-valido')
      expect(refreshTokens.revocarFamilia).toHaveBeenCalledWith('familia-1')
    })

    it('no hace nada si el token no existe (logout idempotente)', async () => {
      refreshTokens.buscarPorHash.mockResolvedValue(null)
      await service.logout('token-inexistente')
      expect(refreshTokens.revocarFamilia).not.toHaveBeenCalled()
    })
  })
})
