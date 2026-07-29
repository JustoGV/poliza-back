import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/prisma/prisma.service'

export interface DatosCrearRefreshToken {
  usuarioId: string
  tokenHash: string
  familiaId: string
  expiraEn: Date
}

@Injectable()
export class RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  crear(datos: DatosCrearRefreshToken) {
    return this.prisma.refreshToken.create({ data: datos })
  }

  buscarPorHash(tokenHash: string) {
    return this.prisma.refreshToken.findUnique({ where: { tokenHash } })
  }

  marcarRevocado(id: string) {
    return this.prisma.refreshToken.update({ where: { id }, data: { revocado: true } })
  }

  /** Reuso detectado o logout: invalida TODOS los descendientes de un mismo login. */
  revocarFamilia(familiaId: string) {
    return this.prisma.refreshToken.updateMany({
      where: { familiaId, revocado: false },
      data: { revocado: true },
    })
  }
}
