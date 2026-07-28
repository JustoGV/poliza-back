import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { CredencialesInvalidasError, SesionInvalidaError } from '@/common/errors'
import { Argon2Hasher } from '@/common/hashing/argon2-hasher.service'
import { parsearDuracionMs } from '@/common/tiempo/parsear-duracion'
import { AppConfigService } from '@/config/app-config.service'
import { AccionAudit } from '@/generated/prisma/enums'
import { AuditoriaRepository } from '../auditoria/auditoria.repository'
import { UsuariosRepository } from '../usuarios/usuarios.repository'
import type { JwtPayload } from './jwt-payload.interface'
import { RefreshTokenRepository } from './refresh-token.repository'

export interface ContextoRequest {
  ip?: string | undefined
  userAgent?: string | undefined
}

export interface ResultadoAutenticacion {
  accessToken: string
  refreshTokenCrudo: string
  refreshExpiraEn: Date
  usuario: { id: string; email: string; nombre: string; rol: JwtPayload['rol'] }
}

function hashSha256(valor: string): string {
  return createHash('sha256').update(valor).digest('hex')
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usuarios: UsuariosRepository,
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly auditoria: AuditoriaRepository,
    private readonly jwt: JwtService,
    private readonly hasher: Argon2Hasher,
    private readonly config: AppConfigService,
  ) {
    // Hash argon2id real de una contraseña que nunca va a existir — así,
    // cuando el email no existe, `argon2.verify` igual hace un trabajo de
    // CPU comparable al de un login real (un string armado a mano en vez de
    // un hash válido haría que `verify` tire excepción, no que devuelva
    // false). Evita que el tiempo de respuesta filtre si la cuenta existe.
    this.hashDummy = this.hasher.hash('dummy-password-que-nunca-coincide')
  }

  private readonly hashDummy: Promise<string>

  async login(email: string, password: string, contexto: ContextoRequest): Promise<ResultadoAutenticacion> {
    const usuario = await this.usuarios.buscarPorEmail(email)

    // Mismo error y (aproximadamente) mismo trabajo tanto si el email no
    // existe como si la contraseña es incorrecta — CLAUDE.md: "nunca revelar
    // si el email existe".
    const hashParaComparar = usuario?.passwordHash ?? (await this.hashDummy)
    const claveValida = await this.hasher.verificar(hashParaComparar, password)

    if (!usuario || !usuario.activo || !claveValida) {
      await this.auditoria.registrar({
        accion: AccionAudit.LOGIN_FALLIDO,
        entidadTipo: 'usuario',
        ...(usuario === null ? {} : { entidadId: usuario.id, usuarioId: usuario.id }),
        ...(contexto.ip === undefined ? {} : { ip: contexto.ip }),
        ...(contexto.userAgent === undefined ? {} : { userAgent: contexto.userAgent }),
      })
      throw new CredencialesInvalidasError()
    }

    await this.usuarios.actualizarUltimoLogin(usuario.id)
    await this.auditoria.registrar({
      usuarioId: usuario.id,
      accion: AccionAudit.LOGIN,
      entidadTipo: 'usuario',
      entidadId: usuario.id,
      ...(contexto.ip === undefined ? {} : { ip: contexto.ip }),
      ...(contexto.userAgent === undefined ? {} : { userAgent: contexto.userAgent }),
    })

    const payload: JwtPayload = { sub: usuario.id, email: usuario.email, rol: usuario.rol }
    const accessToken = await this.jwt.signAsync(payload)
    const { crudo, expiraEn } = await this.emitirRefreshToken(usuario.id, randomUUID())

    return {
      accessToken,
      refreshTokenCrudo: crudo,
      refreshExpiraEn: expiraEn,
      usuario: { id: usuario.id, email: usuario.email, nombre: usuario.nombre, rol: usuario.rol },
    }
  }

  async refrescar(refreshTokenCrudo: string): Promise<ResultadoAutenticacion> {
    const hash = hashSha256(refreshTokenCrudo)
    const fila = await this.refreshTokens.buscarPorHash(hash)

    if (!fila) {
      throw new SesionInvalidaError()
    }

    if (fila.revocado) {
      // El token que llega ya fue rotado (o la familia ya fue revocada):
      // reuso — probable robo de cookie. Se mata la familia entera.
      await this.refreshTokens.revocarFamilia(fila.familiaId)
      throw new SesionInvalidaError()
    }

    if (fila.expiraEn.getTime() < Date.now()) {
      throw new SesionInvalidaError()
    }

    const usuario = await this.usuarios.buscarPorId(fila.usuarioId)
    if (!usuario?.activo) {
      await this.refreshTokens.revocarFamilia(fila.familiaId)
      throw new SesionInvalidaError()
    }

    await this.refreshTokens.marcarRevocado(fila.id)

    const payload: JwtPayload = { sub: usuario.id, email: usuario.email, rol: usuario.rol }
    const accessToken = await this.jwt.signAsync(payload)
    const { crudo, expiraEn } = await this.emitirRefreshToken(usuario.id, fila.familiaId)

    return {
      accessToken,
      refreshTokenCrudo: crudo,
      refreshExpiraEn: expiraEn,
      usuario: { id: usuario.id, email: usuario.email, nombre: usuario.nombre, rol: usuario.rol },
    }
  }

  async logout(refreshTokenCrudo: string): Promise<void> {
    const hash = hashSha256(refreshTokenCrudo)
    const fila = await this.refreshTokens.buscarPorHash(hash)
    if (fila) {
      await this.refreshTokens.revocarFamilia(fila.familiaId)
    }
  }

  private async emitirRefreshToken(
    usuarioId: string,
    familiaId: string,
  ): Promise<{ crudo: string; expiraEn: Date }> {
    const crudo = randomBytes(32).toString('base64url')
    const expiraEn = new Date(Date.now() + parsearDuracionMs(this.config.jwtRefreshTtl))
    await this.refreshTokens.crear({
      usuarioId,
      familiaId,
      tokenHash: hashSha256(crudo),
      expiraEn,
    })
    return { crudo, expiraEn }
  }
}
