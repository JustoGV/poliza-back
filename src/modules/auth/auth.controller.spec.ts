import type { Request, Response } from 'express'
import { SesionInvalidaError } from '@/common/errors'
import type { AppConfigService } from '@/config/app-config.service'
import type { ResultadoAutenticacion } from './auth.service'
import { AuthController } from './auth.controller'
import type { AuthService } from './auth.service'
import type { LoginDto } from './dto/login.dto'

function crearResultado(overrides: Partial<ResultadoAutenticacion> = {}): ResultadoAutenticacion {
  return {
    accessToken: 'access-token',
    refreshTokenCrudo: 'refresh-crudo',
    refreshExpiraEn: new Date(Date.now() + 60_000),
    usuario: { id: 'u1', email: 'ana@mfseguros.com.ar', nombre: 'Ana', rol: 'OPERADOR' },
    ...overrides,
  }
}

function crearRequest(cookies: Record<string, string> = {}): Request {
  return {
    ip: '127.0.0.1',
    get: () => 'jest-agent',
    cookies,
  } as unknown as Request
}

function crearRequestSinContexto(cookies: Record<string, string> = {}): Request {
  return {
    ip: undefined,
    get: () => undefined,
    cookies,
  } as unknown as Request
}

function crearResponse(): jest.Mocked<Pick<Response, 'cookie' | 'clearCookie'>> {
  return { cookie: jest.fn(), clearCookie: jest.fn() }
}

describe('AuthController', () => {
  let authService: jest.Mocked<AuthService>
  let config: AppConfigService
  let controller: AuthController

  beforeEach(() => {
    authService = {
      login: jest.fn(),
      refrescar: jest.fn(),
      logout: jest.fn(),
    } as unknown as jest.Mocked<AuthService>

    config = {
      refreshCookieName: 'mf_rt',
      refreshCookieSecure: false,
      refreshCookieDomain: 'localhost',
      apiPrefix: 'api',
    } as unknown as AppConfigService

    controller = new AuthController(authService, config)
  })

  it('login: setea la cookie de refresh y devuelve accessToken + usuario', async () => {
    const resultado = crearResultado()
    authService.login.mockResolvedValue(resultado)
    const response = crearResponse()
    const dto: LoginDto = { email: 'ana@mfseguros.com.ar', password: 'clave' }

    const body = await controller.login(dto, crearRequest(), response as unknown as Response)

    expect(authService.login).toHaveBeenCalledWith('ana@mfseguros.com.ar', 'clave', {
      ip: '127.0.0.1',
      userAgent: 'jest-agent',
    })
    expect(response.cookie).toHaveBeenCalledWith('mf_rt', 'refresh-crudo', expect.any(Object))
    expect(body).toEqual({ accessToken: 'access-token', usuario: resultado.usuario })
  })

  it('login: funciona sin ip ni user-agent en el request', async () => {
    const resultado = crearResultado()
    authService.login.mockResolvedValue(resultado)
    const response = crearResponse()
    const dto: LoginDto = { email: 'ana@mfseguros.com.ar', password: 'clave' }

    await controller.login(dto, crearRequestSinContexto(), response as unknown as Response)

    expect(authService.login).toHaveBeenCalledWith('ana@mfseguros.com.ar', 'clave', {})
  })

  it('refresh: lee la cookie, rota el token y devuelve el nuevo accessToken', async () => {
    const resultado = crearResultado({ accessToken: 'access-token-nuevo' })
    authService.refrescar.mockResolvedValue(resultado)
    const response = crearResponse()

    const body = await controller.refresh(crearRequest({ mf_rt: 'refresh-viejo' }), response as unknown as Response)

    expect(authService.refrescar).toHaveBeenCalledWith('refresh-viejo')
    expect(response.cookie).toHaveBeenCalled()
    expect(body.accessToken).toBe('access-token-nuevo')
  })

  it('refresh: sin cookie tira SesionInvalidaError sin llamar al service', async () => {
    const response = crearResponse()
    await expect(controller.refresh(crearRequest({}), response as unknown as Response)).rejects.toThrow(
      SesionInvalidaError,
    )
    expect(authService.refrescar).not.toHaveBeenCalled()
  })

  it('logout: revoca la sesión y limpia la cookie cuando hay refresh token', async () => {
    const response = crearResponse()
    const body = await controller.logout(crearRequest({ mf_rt: 'refresh-viejo' }), response as unknown as Response)

    expect(authService.logout).toHaveBeenCalledWith('refresh-viejo')
    expect(response.clearCookie).toHaveBeenCalled()
    expect(body).toEqual({ ok: true })
  })

  it('logout: es idempotente sin cookie (limpia igual, no llama al service)', async () => {
    const response = crearResponse()
    await controller.logout(crearRequest({}), response as unknown as Response)

    expect(authService.logout).not.toHaveBeenCalled()
    expect(response.clearCookie).toHaveBeenCalled()
  })
})
