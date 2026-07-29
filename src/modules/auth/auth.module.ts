import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { Argon2Hasher } from '@/common/hashing/argon2-hasher.service'
import { parsearDuracionMs } from '@/common/tiempo/parsear-duracion'
import { AppConfigModule } from '@/config/app-config.module'
import { AppConfigService } from '@/config/app-config.service'
import { AuditoriaModule } from '../auditoria/auditoria.module'
import { UsuariosModule } from '../usuarios/usuarios.module'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { LoginThrottlerGuard } from './guards/login-throttler.guard'
import { RefreshTokenRepository } from './refresh-token.repository'
import { JwtAccessStrategy } from './strategies/jwt-access.strategy'

@Module({
  imports: [
    AppConfigModule,
    UsuariosModule,
    AuditoriaModule,
    PassportModule,
    JwtModule.registerAsync({
      useFactory: (config: AppConfigService) => ({
        secret: config.jwtAccessSecret,
        signOptions: { expiresIn: parsearDuracionMs(config.jwtAccessTtl) },
      }),
      inject: [AppConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, RefreshTokenRepository, JwtAccessStrategy, Argon2Hasher, LoginThrottlerGuard],
  exports: [AuthService],
})
export class AuthModule {}
