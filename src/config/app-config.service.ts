import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { EnvSchema } from './env.schema'

/**
 * Fachada tipada sobre `ConfigService`. Nadie en la app lee `process.env`
 * directamente: todo pasa por acá, así una variable nueva se declara una
 * sola vez (env.schema.ts) y se consume con autocompletado en todos lados.
 */
@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService<EnvSchema, true>) {}

  get nodeEnv(): EnvSchema['NODE_ENV'] {
    return this.configService.get('NODE_ENV', { infer: true })
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production'
  }

  get apiPort(): number {
    return this.configService.get('API_PORT', { infer: true })
  }

  get apiPrefix(): string {
    return this.configService.get('API_PREFIX', { infer: true })
  }

  get corsOrigins(): string[] {
    return this.configService
      .get('CORS_ORIGINS', { infer: true })
      .split(',')
      .map((origen) => origen.trim())
  }

  get databaseUrl(): string {
    return this.configService.get('DATABASE_URL', { infer: true })
  }

  get jwtAccessSecret(): string {
    return this.configService.get('JWT_ACCESS_SECRET', { infer: true })
  }

  get jwtRefreshSecret(): string {
    return this.configService.get('JWT_REFRESH_SECRET', { infer: true })
  }

  get jwtAccessTtl(): string {
    return this.configService.get('JWT_ACCESS_TTL', { infer: true })
  }

  get jwtRefreshTtl(): string {
    return this.configService.get('JWT_REFRESH_TTL', { infer: true })
  }

  get refreshCookieName(): string {
    return this.configService.get('REFRESH_COOKIE_NAME', { infer: true })
  }

  get refreshCookieSecure(): boolean {
    return this.configService.get('REFRESH_COOKIE_SECURE', { infer: true })
  }

  get refreshCookieDomain(): string {
    return this.configService.get('REFRESH_COOKIE_DOMAIN', { infer: true })
  }

  get throttleTtlMs(): number {
    return this.configService.get('THROTTLE_TTL_MS', { infer: true })
  }

  get throttleLimit(): number {
    return this.configService.get('THROTTLE_LIMIT', { infer: true })
  }

  get throttleLoginTtlMs(): number {
    return this.configService.get('THROTTLE_LOGIN_TTL_MS', { infer: true })
  }

  get throttleLoginLimit(): number {
    return this.configService.get('THROTTLE_LOGIN_LIMIT', { infer: true })
  }
}
