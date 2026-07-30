import { Injectable, type OnModuleInit } from '@nestjs/common'
import { DiscoveryService, Reflector } from '@nestjs/core'
import { ParserNoEncontradoError } from '@/common/errors'
import { ES_PARSER } from './parser.decorator'
import type { Parser } from './parser.interface'

@Injectable()
export class ParserRegistry implements OnModuleInit {
  private readonly parsers = new Map<string, Parser>()

  constructor(
    private readonly discovery: DiscoveryService,
    private readonly reflector: Reflector,
  ) {}

  onModuleInit(): void {
    for (const wrapper of this.discovery.getProviders()) {
      const instancia: unknown = wrapper.instance
      if (!instancia || typeof instancia !== 'object') {
        continue
      }
      const esParser = this.reflector.get<boolean>(ES_PARSER, instancia.constructor)
      if (!esParser) {
        continue
      }
      const parser = instancia as Parser
      this.parsers.set(parser.parserKey, parser)
    }
  }

  resolve(parserKey: string): Parser {
    const parser = this.parsers.get(parserKey)
    if (!parser) {
      throw new ParserNoEncontradoError(parserKey)
    }
    return parser
  }
}
