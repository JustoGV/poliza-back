import type { AppConfigService } from '@/config/app-config.service'
import { JwtAccessStrategy } from './jwt-access.strategy'

describe('JwtAccessStrategy', () => {
  it('valida devolviendo el payload tal cual (ya fue verificado por passport-jwt)', () => {
    const config = { jwtAccessSecret: 'un-secreto-de-al-menos-32-caracteres' } as unknown as AppConfigService
    const strategy = new JwtAccessStrategy(config)
    const payload = { sub: 'u1', email: 'ana@mfseguros.com.ar', rol: 'OPERADOR' as const }

    expect(strategy.validate(payload)).toBe(payload)
  })
})
