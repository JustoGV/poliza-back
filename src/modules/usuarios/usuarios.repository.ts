import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/prisma/prisma.service'

@Injectable()
export class UsuariosRepository {
  constructor(private readonly prisma: PrismaService) {}

  buscarPorEmail(email: string) {
    return this.prisma.usuario.findUnique({ where: { email } })
  }

  buscarPorId(id: string) {
    return this.prisma.usuario.findUnique({ where: { id } })
  }

  actualizarUltimoLogin(id: string) {
    return this.prisma.usuario.update({ where: { id }, data: { ultimoLoginEn: new Date() } })
  }
}
