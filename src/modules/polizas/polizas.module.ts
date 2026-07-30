import { AseguradorasModule } from '@/modules/aseguradoras/aseguradoras.module'
import { ClientesModule } from '@/modules/clientes/clientes.module'
import { Module } from '@nestjs/common'
import { PolizasController } from './polizas.controller'
import { PolizasRepository } from './polizas.repository'
import { PolizasService } from './polizas.service'

@Module({
  imports: [AseguradorasModule, ClientesModule],
  controllers: [PolizasController],
  providers: [PolizasService, PolizasRepository],
  exports: [PolizasService, PolizasRepository],
})
export class PolizasModule {}
