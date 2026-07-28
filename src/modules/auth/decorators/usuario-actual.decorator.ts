import { createParamDecorator, type ExecutionContext } from '@nestjs/common'
import type { JwtPayload } from '../jwt-payload.interface'

export const UsuarioActual = createParamDecorator((_data: unknown, ctx: ExecutionContext): JwtPayload => {
  const request = ctx.switchToHttp().getRequest<{ user: JwtPayload }>()
  return request.user
})
