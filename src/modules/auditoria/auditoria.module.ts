import { Module } from '@nestjs/common'
import { AuditoriaRepository } from './auditoria.repository'

@Module({
  providers: [AuditoriaRepository],
  exports: [AuditoriaRepository],
})
export class AuditoriaModule {}
