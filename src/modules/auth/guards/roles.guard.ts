import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { RolUsuario } from '@/generated/prisma/client'
import { ROLES_KEY } from '../decorators/roles.decorator'
import type { JwtPayload } from '../jwt-payload.interface'

/**
 * Global vía APP_GUARD, igual que JwtAuthGuard. Sin @Roles() en el handler,
 * deja pasar — el endpoint sólo exige estar autenticado, no un rol puntual.
 * Corre DESPUÉS de JwtAuthGuard: depende de que `request.user` ya exista.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rolesRequeridos = this.reflector.getAllAndOverride<RolUsuario[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!rolesRequeridos || rolesRequeridos.length === 0) {
      return true
    }
    const request = context.switchToHttp().getRequest<{ user?: JwtPayload }>()
    if (!request.user) {
      return false
    }
    return rolesRequeridos.includes(request.user.rol)
  }
}
