import type { Reflector } from '@nestjs/core'
import type { ThrottlerStorage } from '@nestjs/throttler'
import type { AppConfigService } from '@/config/app-config.service'
import { LoginThrottlerGuard } from './login-throttler.guard'

describe('LoginThrottlerGuard', () => {
  it('configura un throttler nombrado "login" con los límites del config', () => {
    const config = { throttleLoginTtlMs: 900_000, throttleLoginLimit: 5 } as unknown as AppConfigService
    const storage = { increment: jest.fn() } as unknown as ThrottlerStorage
    const reflector = {} as unknown as Reflector

    const guard = new LoginThrottlerGuard(config, storage, reflector)

    const opciones = (
      guard as unknown as { options: { throttlers: { name: string; ttl: number; limit: number }[] } }
    ).options
    expect(opciones.throttlers).toEqual([{ name: 'login', ttl: 900_000, limit: 5 }])
  })
})
