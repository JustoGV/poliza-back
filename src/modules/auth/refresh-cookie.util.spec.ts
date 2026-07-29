import type { Response } from 'express'
import type { AppConfigService } from '@/config/app-config.service'
import { limpiarCookieRefresh, setearCookieRefresh } from './refresh-cookie.util'

function crearConfig(overrides: Partial<AppConfigService> = {}): AppConfigService {
  return {
    refreshCookieSecure: false,
    refreshCookieDomain: 'localhost',
    apiPrefix: 'api',
    refreshCookieName: 'mf_rt',
    ...overrides,
  } as unknown as AppConfigService
}

function crearResponse(): jest.Mocked<Pick<Response, 'cookie' | 'clearCookie'>> {
  return { cookie: jest.fn(), clearCookie: jest.fn() }
}

describe('refresh-cookie.util', () => {
  it('setea la cookie httpOnly con path acotado a /api/auth', () => {
    const response = crearResponse()
    const config = crearConfig()
    const expiraEn = new Date(Date.now() + 60_000)

    setearCookieRefresh(response as unknown as Response, config, 'token-crudo', expiraEn)

    expect(response.cookie).toHaveBeenCalledWith(
      'mf_rt',
      'token-crudo',
      expect.objectContaining({
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        domain: 'localhost',
        path: '/api/auth',
        expires: expiraEn,
      }),
    )
  })

  it('limpia la cookie con las mismas opciones de path/dominio', () => {
    const response = crearResponse()
    const config = crearConfig()

    limpiarCookieRefresh(response as unknown as Response, config)

    expect(response.clearCookie).toHaveBeenCalledWith(
      'mf_rt',
      expect.objectContaining({ path: '/api/auth', domain: 'localhost' }),
    )
  })
})
