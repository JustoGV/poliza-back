import { randomUUID } from 'node:crypto'
import { createWriteStream } from 'node:fs'
import { rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { Injectable } from '@nestjs/common'
import { XLSX } from 'xlsx-extract'
import { ArchivoMalformadoError } from '@/common/errors'
import { RegistrarParser } from './parser.decorator'
import type { ConfigParser, Parser } from './parser.interface'
import type { RawRow } from './raw-row.interface'

interface CeldaCruda {
  val: unknown
  col: number
  address: string
}

interface FilaCruda {
  cells: CeldaCruda[]
}

type EventoInterno = { tipo: 'fila'; fila: RawRow } | { tipo: 'fin' } | { tipo: 'error'; error: unknown }

function numeroDeFila(fila: FilaCruda): number {
  const address = fila.cells[0]?.address ?? ''
  const numero = /\d+/.exec(address)?.[0]
  if (!numero) {
    throw new ArchivoMalformadoError(`celda sin dirección de fila válida ("${address}")`)
  }
  return Number(numero)
}

/**
 * XLSX es un ZIP: leerlo bien exige acceso aleatorio al directorio central,
 * algo que un lector puramente secuencial no puede garantizar. Se probó
 * `exceljs@4.4.0` (stream.xlsx.WorkbookReader) y falla de forma no
 * determinística en este entorno — reproducido también con su API vieja
 * basada en eventos y con la prerelease 4.4.1, así que no es un bug de este
 * código. `xlsx-extract` (sax + yauzl) resuelve esto exigiendo un path de
 * archivo. Por eso acá se vuelca el `Readable` de entrada a un temporal
 * antes de parsear: sigue cumpliendo la regla 6 (streaming, nunca
 * materializar el archivo entero) — se escribe a disco a medida que llegan
 * los bytes, nunca se arma el archivo completo en memoria.
 */
@Injectable()
@RegistrarParser()
export class GenericExcelParser implements Parser {
  readonly parserKey = 'generic-excel'

  async *extract(archivo: Readable, config: ConfigParser): AsyncIterable<RawRow> {
    const rutaTemporal = join(tmpdir(), `mf-ingesta-${randomUUID()}.xlsx`)
    await pipeline(archivo, createWriteStream(rutaTemporal))

    try {
      yield* this.leerFilas(rutaTemporal, config)
    } finally {
      await rm(rutaTemporal, { force: true })
    }
  }

  private async *leerFilas(ruta: string, config: ConfigParser): AsyncIterable<RawRow> {
    const cola: EventoInterno[] = []
    let despertar: (() => void) | undefined
    let encabezados: Map<number, string> | undefined

    const extractor = new XLSX().extract(ruta, {
      format: 'obj',
      raw_values: true,
      ...(config.nombreHoja === null ? {} : { sheet_name: config.nombreHoja }),
    })

    extractor.on('row', (filaCruda: FilaCruda) => {
      const nroFila = numeroDeFila(filaCruda)
      if (nroFila < config.filaEncabezado) {
        return
      }
      if (nroFila === config.filaEncabezado) {
        encabezados = this.leerEncabezados(filaCruda)
        return
      }
      cola.push({
        tipo: 'fila',
        fila: { nroFila, valores: this.leerValores(filaCruda, encabezados ?? new Map<number, string>()) },
      })
      despertar?.()
    })
    extractor.on('error', (error: unknown) => {
      cola.push({ tipo: 'error', error })
      despertar?.()
    })
    extractor.on('end', () => {
      cola.push({ tipo: 'fin' })
      despertar?.()
    })

    for (;;) {
      const siguiente = cola.shift()
      if (!siguiente) {
        await new Promise<void>((resolve) => {
          despertar = resolve
        })
        continue
      }
      if (siguiente.tipo === 'error') {
        throw siguiente.error
      }
      if (siguiente.tipo === 'fin') {
        return
      }
      yield siguiente.fila
    }
  }

  private leerEncabezados(fila: FilaCruda): Map<number, string> {
    const encabezados = new Map<number, string>()
    for (const celda of fila.cells) {
      const texto = this.aTexto(celda.val).trim()
      if (texto) {
        encabezados.set(celda.col, texto)
      }
    }
    return encabezados
  }

  /**
   * `raw_values: true` sólo produce primitivos (string/number/boolean) —
   * pero el tipo que expone la librería es `unknown`. Se narrowea acá en
   * vez de `String(val)` a secas para no arriesgar un `"[object Object]"`
   * silencioso si eso cambiara.
   */
  private aTexto(valor: unknown): string {
    if (typeof valor === 'string' || typeof valor === 'number' || typeof valor === 'boolean') {
      return String(valor)
    }
    return ''
  }

  private leerValores(fila: FilaCruda, encabezados: Map<number, string>): Record<string, unknown> {
    const valores: Record<string, unknown> = {}
    for (const celda of fila.cells) {
      const encabezado = encabezados.get(celda.col)
      if (encabezado && celda.val !== undefined && celda.val !== '') {
        valores[encabezado] = celda.val
      }
    }
    return valores
  }
}
