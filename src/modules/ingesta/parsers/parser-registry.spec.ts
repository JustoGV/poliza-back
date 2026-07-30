import { DiscoveryModule } from '@nestjs/core'
import { Test } from '@nestjs/testing'
import { ParserNoEncontradoError } from '@/common/errors'
import { ParserRegistry } from './parser-registry'
import { RegistrarParser } from './parser.decorator'
import type { Parser } from './parser.interface'
import type { RawRow } from './raw-row.interface'

@RegistrarParser()
class ParserDeMentira implements Parser {
  readonly parserKey = 'DE_MENTIRA_V1'

  async *extract(): AsyncIterable<RawRow> {
    await Promise.resolve()
    yield { nroFila: 1, valores: { foo: 'bar' } }
  }
}

/**
 * Simula lo que hará F4-05 (GenericExcelParser) y cualquier Strategy futura
 * (regla 1 y 2 de CLAUDE.md): un parser nuevo se suma como provider más acá
 * abajo, sin tocar `parser-registry.ts` ni `ParserDeMentira`.
 */
@RegistrarParser()
class OtroParserDeMentira implements Parser {
  readonly parserKey = 'OTRO_DE_MENTIRA_V1'

  async *extract(): AsyncIterable<RawRow> {
    await Promise.resolve()
    yield { nroFila: 1, valores: { baz: 'qux' } }
  }
}

class NoEsUnParser {
  hacerOtraCosa(): void {
    // Provider cualquiera del módulo, sin @RegistrarParser() — el registro
    // tiene que ignorarlo en vez de romper.
  }
}

describe('ParserRegistry', () => {
  let registry: ParserRegistry

  beforeEach(async () => {
    const modulo = await Test.createTestingModule({
      imports: [DiscoveryModule],
      providers: [ParserRegistry, ParserDeMentira, OtroParserDeMentira, NoEsUnParser],
    }).compile()

    const app = modulo.createNestApplication()
    await app.init()

    registry = modulo.get(ParserRegistry)
  })

  it('resuelve un parser registrado por su parserKey', () => {
    const parser = registry.resolve('DE_MENTIRA_V1')
    expect(parser).toBeInstanceOf(ParserDeMentira)
  })

  it('resuelve un segundo parser sumado al registro sin tocar el primero', () => {
    const parser = registry.resolve('OTRO_DE_MENTIRA_V1')
    expect(parser).toBeInstanceOf(OtroParserDeMentira)
  })

  it('lanza ParserNoEncontradoError si el parser_key no está registrado', () => {
    expect(() => registry.resolve('INEXISTENTE')).toThrow(ParserNoEncontradoError)
  })
})
