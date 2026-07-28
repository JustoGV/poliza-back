import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'
import { AppConfigService } from '@/config/app-config.service'
import { PrismaClient } from '@/generated/prisma/client'

/**
 * Prisma 7 (generator "prisma-client") requiere un driver adapter explícito
 * en vez de leer la datasource url sola desde el schema — por eso `@prisma/
 * adapter-pg` en vez del `env("DATABASE_URL")` clásico.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name)

  constructor(appConfigService: AppConfigService) {
    super({ adapter: new PrismaPg({ connectionString: appConfigService.databaseUrl }) })
  }

  async onModuleInit(): Promise<void> {
    await this.$connect()
    this.logger.log('Conectado a Postgres')
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect()
  }
}
