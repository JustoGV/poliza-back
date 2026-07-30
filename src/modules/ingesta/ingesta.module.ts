import { Module } from '@nestjs/common'
import { DiscoveryModule } from '@nestjs/core'
import { GenericExcelParser } from './parsers/generic-excel.parser'
import { ParserRegistry } from './parsers/parser-registry'

/**
 * `ParserRegistry` descubre parsers vía `DiscoveryService` (ver
 * parser-registry.ts) — de ahí `DiscoveryModule`. Sumar una aseguradora que
 * necesite un parser dedicado (regla 1 y 2 de CLAUDE.md: sólo ante una
 * rareza estructural real) es agregar la clase acá abajo — nunca tocar
 * `parser-registry.ts` ni los parsers existentes.
 */
@Module({
  imports: [DiscoveryModule],
  providers: [ParserRegistry, GenericExcelParser],
  exports: [ParserRegistry],
})
export class IngestaModule {}
