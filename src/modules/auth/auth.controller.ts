import { Body, Controller, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import type { Request, Response } from 'express'
import { ZodResponse } from 'nestjs-zod'
import { SesionInvalidaError } from '@/common/errors'
import { AppConfigService } from '@/config/app-config.service'
import { AuthService } from './auth.service'
import { Public } from './decorators/public.decorator'
import { LoginDto } from './dto/login.dto'
import { SesionDto } from './dto/sesion.dto'
import { LoginThrottlerGuard } from './guards/login-throttler.guard'
import { limpiarCookieRefresh, setearCookieRefresh } from './refresh-cookie.util'

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: AppConfigService,
  ) {}

  @Public()
  @UseGuards(LoginThrottlerGuard)
  @Post('login')
  @HttpCode(200)
  @ZodResponse({ status: 200, description: 'Sesión iniciada', type: SesionDto })
  async login(@Body() dto: LoginDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const userAgent = request.get('user-agent')
    const resultado = await this.authService.login(dto.email, dto.password, {
      ...(request.ip === undefined ? {} : { ip: request.ip }),
      ...(userAgent === undefined ? {} : { userAgent }),
    })
    setearCookieRefresh(response, this.config, resultado.refreshTokenCrudo, resultado.refreshExpiraEn)
    return { accessToken: resultado.accessToken, usuario: resultado.usuario }
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  @ZodResponse({ status: 200, description: 'Access token renovado', type: SesionDto })
  async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const refreshTokenCrudo = this.leerCookieRefresh(request)
    const resultado = await this.authService.refrescar(refreshTokenCrudo)
    setearCookieRefresh(response, this.config, resultado.refreshTokenCrudo, resultado.refreshExpiraEn)
    return { accessToken: resultado.accessToken, usuario: resultado.usuario }
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response): Promise<{ ok: true }> {
    const refreshTokenCrudo = request.cookies[this.config.refreshCookieName] as string | undefined
    if (refreshTokenCrudo) {
      await this.authService.logout(refreshTokenCrudo)
    }
    limpiarCookieRefresh(response, this.config)
    return { ok: true }
  }

  private leerCookieRefresh(request: Request): string {
    const valor = request.cookies[this.config.refreshCookieName] as string | undefined
    if (!valor) {
      throw new SesionInvalidaError()
    }
    return valor
  }
}
