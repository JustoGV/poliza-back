import { Module } from '@nestjs/common'
import { AseguradorasController } from './aseguradoras.controller'
import { AseguradorasRepository } from './aseguradoras.repository'
import { AseguradorasService } from './aseguradoras.service'

@Module({
  controllers: [AseguradorasController],
  providers: [AseguradorasRepository, AseguradorasService],
  exports: [AseguradorasService, AseguradorasRepository],
})
export class AseguradorasModule {}
