import { Injectable, type ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthGuard } from '@nestjs/passport'
import { IS_PUBLIC_KEY } from '../decorators/public.decorator'

/**
 * Global vía APP_GUARD (CLAUDE.md: "seguro por defecto"). Un endpoint nuevo
 * sin @Public() queda protegido automáticamente sin tocar este archivo.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super()
  }

  override canActivate(context: ExecutionContext) {
    const esPublico = this.reflector.getAllAndOverride<boolean | undefined>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (esPublico) {
      return true
    }
    return super.canActivate(context)
  }
}
