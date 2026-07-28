import type { RolUsuario } from '@/generated/prisma/client'

export interface JwtPayload {
  sub: string
  email: string
  rol: RolUsuario
}
