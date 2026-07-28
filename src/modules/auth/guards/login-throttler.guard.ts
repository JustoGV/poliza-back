import { Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { InjectThrottlerStorage, ThrottlerGuard, type ThrottlerStorage } from '@nestjs/throttler'
import { AppConfigService } from '@/config/app-config.service'

/**
 * Bucket propio, separado del ThrottlerGuard global (APP_GUARD, 'default').
 * Se aplica sólo en @Post('login') vía @UseGuards — así el límite estricto
 * de intentos de login NUNCA se comparte con el resto de la API (si fuera
 * un throttler nombrado global, cualquier endpoint navegado seguido gastaría
 * la misma cuota que el login). CLAUDE.md: "el sexto intento de login en 15
 * min devuelve 429".
 */
@Injectable()
export class LoginThrottlerGuard extends ThrottlerGuard {
  constructor(
    config: AppConfigService,
    @InjectThrottlerStorage() storage: ThrottlerStorage,
    reflector: Reflector,
  ) {
    super(
      { throttlers: [{ name: 'login', ttl: config.throttleLoginTtlMs, limit: config.throttleLoginLimit }] },
      storage,
      reflector,
    )
  }
}
