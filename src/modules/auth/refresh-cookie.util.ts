import type { CookieOptions, Response } from 'express'
import type { AppConfigService } from '@/config/app-config.service'

/**
 * `path` acotado a /auth: el navegador sólo manda esta cookie a login,
 * refresh y logout — no viaja en cada request a la API como el access token.
 */
function opciones(config: AppConfigService, expiraEn?: Date): CookieOptions {
  return {
    httpOnly: true,
    secure: config.refreshCookieSecure,
    sameSite: 'strict',
    domain: config.refreshCookieDomain,
    path: `/${config.apiPrefix}/auth`,
    ...(expiraEn === undefined ? {} : { expires: expiraEn }),
  }
}

export function setearCookieRefresh(
  response: Response,
  config: AppConfigService,
  refreshTokenCrudo: string,
  expiraEn: Date,
): void {
  response.cookie(config.refreshCookieName, refreshTokenCrudo, opciones(config, expiraEn))
}

export function limpiarCookieRefresh(response: Response, config: AppConfigService): void {
  response.clearCookie(config.refreshCookieName, opciones(config))
}
