import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AppConfigModule } from './config/app-config.module'
import { AppConfigService } from './config/app-config.service'
import { AseguradorasModule } from './modules/aseguradoras/aseguradoras.module'
import { AuditoriaModule } from './modules/auditoria/auditoria.module'
import { AuthModule } from './modules/auth/auth.module'
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard'
import { RolesGuard } from './modules/auth/guards/roles.guard'
import { ClientesModule } from './modules/clientes/clientes.module'
import { PolizasModule } from './modules/polizas/polizas.module'
import { UsuariosModule } from './modules/usuarios/usuarios.module'
import { PrismaModule } from './prisma/prisma.module'

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    ThrottlerModule.forRootAsync({
      useFactory: (config: AppConfigService) => ({
        throttlers: [{ ttl: config.throttleTtlMs, limit: config.throttleLimit }],
      }),
      inject: [AppConfigService],
    }),
    UsuariosModule,
    AuditoriaModule,
    AuthModule,
    AseguradorasModule,
    ClientesModule,
    PolizasModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Orden importa: throttle antes que nada; JwtAuthGuard puebla
    // request.user; RolesGuard depende de que ya esté poblado.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
