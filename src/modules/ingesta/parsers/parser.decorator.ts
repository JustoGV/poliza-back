import { SetMetadata } from '@nestjs/common'

export const ES_PARSER = Symbol('ES_PARSER')

/**
 * Marca una clase como `Parser` para que `ParserRegistry` la descubra sola
 * (ver parser-registry.ts). Nest no tiene un multi-provider genérico como
 * Angular — `{ provide: X, useClass: Y, multi: true }` no existe salvo para
 * los tokens propios del framework (`APP_GUARD`, `APP_FILTER`, ...). Esto es
 * lo que lo reemplaza: la clase se decora, se suma como provider normal a
 * algún módulo, y el registro la encuentra vía `DiscoveryService` en
 * `onModuleInit`. Cero switch, cero lista central que editar (regla 2 de
 * CLAUDE.md).
 */
export const RegistrarParser = () => SetMetadata(ES_PARSER, true)
