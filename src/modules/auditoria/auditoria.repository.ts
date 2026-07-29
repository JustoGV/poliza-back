import { Injectable } from '@nestjs/common'
import type { Prisma } from '@/generated/prisma/client'
import type { AccionAudit } from '@/generated/prisma/enums'
import { PrismaService } from '@/prisma/prisma.service'

export interface DatosRegistrarAuditoria {
  usuarioId?: string | undefined
  accion: AccionAudit
  entidadTipo: string
  entidadId?: string | undefined
  datos?: Prisma.InputJsonValue | undefined
  ip?: string | undefined
  userAgent?: string | undefined
}

@Injectable()
export class AuditoriaRepository {
  constructor(private readonly prisma: PrismaService) {}

  registrar(datos: DatosRegistrarAuditoria) {
    return this.prisma.auditLog.create({
      data: {
        ...(datos.usuarioId === undefined ? {} : { usuarioId: datos.usuarioId }),
        accion: datos.accion,
        entidadTipo: datos.entidadTipo,
        ...(datos.entidadId === undefined ? {} : { entidadId: datos.entidadId }),
        ...(datos.datos === undefined ? {} : { datos: datos.datos }),
        ...(datos.ip === undefined ? {} : { ip: datos.ip }),
        ...(datos.userAgent === undefined ? {} : { userAgent: datos.userAgent }),
      },
    })
  }
}
