import { randomUUID } from 'node:crypto'
import { createReadStream, promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import ExcelJS from 'exceljs'
import type { ConfigParser } from './parser.interface'
import { GenericExcelParser } from './generic-excel.parser'
import type { RawRow } from './raw-row.interface'

const configBase: ConfigParser = {
  nombreHoja: null,
  filaEncabezado: 1,
  delimitador: null,
  encoding: 'utf8',
}

async function crearFixture(
  hojas: { nombre: string; encabezados: string[]; filas: unknown[][] }[],
): Promise<string> {
  const ruta = join(tmpdir(), `mf-seguros-${randomUUID()}.xlsx`)
  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ filename: ruta, useStyles: false })

  for (const { nombre, encabezados, filas } of hojas) {
    const hoja = workbook.addWorksheet(nombre)
    // Array vacío = el test arma el encabezado a mano dentro de `filas`
    // (ej. para probar filaEncabezado != 1) — escribir una fila vacía acá
    // correría la numeración física del resto.
    if (encabezados.length > 0) {
      hoja.addRow(encabezados).commit()
    }
    for (const fila of filas) {
      hoja.addRow(fila).commit()
    }
    hoja.commit()
  }

  await workbook.commit()
  return ruta
}

async function extraerTodo(parser: GenericExcelParser, ruta: string, config: ConfigParser): Promise<RawRow[]> {
  const filas: RawRow[] = []
  for await (const fila of parser.extract(createReadStream(ruta), config)) {
    filas.push(fila)
  }
  return filas
}

describe('GenericExcelParser', () => {
  const parser = new GenericExcelParser()
  const rutasABorrar: string[] = []

  afterEach(async () => {
    await Promise.all(rutasABorrar.splice(0).map((ruta) => fs.rm(ruta, { force: true })))
  })

  it('mapea cada fila a un RawRow usando la fila de encabezado configurada', async () => {
    const ruta = await crearFixture([
      {
        nombre: 'Polizas',
        encabezados: ['Nro. Pol.', 'Asegurado', 'Prima'],
        filas: [
          ['1240112/1', 'Juan Perez', 15000],
          ['1240113/0', 'Maria Lopez', 22000],
        ],
      },
    ])
    rutasABorrar.push(ruta)

    const filas = await extraerTodo(parser, ruta, configBase)

    expect(filas).toHaveLength(2)
    expect(filas[0]).toEqual({
      nroFila: 2,
      // Strings, nunca float (CLAUDE.md: montos van a Decimal) — el parser
      // no interpreta el valor crudo, eso es nivel 1 (F4-08).
      valores: { 'Nro. Pol.': '1240112/1', Asegurado: 'Juan Perez', Prima: '15000' },
    })
    expect(filas[1]?.nroFila).toBe(3)
  })

  it('usa la primera hoja cuando no hay nombreHoja configurado', async () => {
    const ruta = await crearFixture([
      { nombre: 'Hoja1', encabezados: ['Col'], filas: [['de-hoja-1']] },
      { nombre: 'Hoja2', encabezados: ['Col'], filas: [['de-hoja-2']] },
    ])
    rutasABorrar.push(ruta)

    const filas = await extraerTodo(parser, ruta, configBase)

    expect(filas).toHaveLength(1)
    expect(filas[0]?.valores.Col).toBe('de-hoja-1')
  })

  it('selecciona la hoja por nombre configurado, ignorando las demás', async () => {
    const ruta = await crearFixture([
      { nombre: 'Hoja1', encabezados: ['Col'], filas: [['de-hoja-1']] },
      { nombre: 'Buscada', encabezados: ['Col'], filas: [['de-la-buscada']] },
    ])
    rutasABorrar.push(ruta)

    const filas = await extraerTodo(parser, ruta, { ...configBase, nombreHoja: 'Buscada' })

    expect(filas).toHaveLength(1)
    expect(filas[0]?.valores.Col).toBe('de-la-buscada')
  })

  it('respeta filaEncabezado distinto de 1, ignorando filas previas', async () => {
    const ruta = await crearFixture([
      {
        nombre: 'Polizas',
        encabezados: [],
        filas: [
          ['Reporte mensual — MF Seguros'],
          [],
          ['Nro. Pol.', 'Asegurado'],
          ['1240112/1', 'Juan Perez'],
        ],
      },
    ])
    rutasABorrar.push(ruta)

    const filas = await extraerTodo(parser, ruta, { ...configBase, filaEncabezado: 3 })

    expect(filas).toHaveLength(1)
    expect(filas[0]).toEqual({
      nroFila: 4,
      valores: { 'Nro. Pol.': '1240112/1', Asegurado: 'Juan Perez' },
    })
  })

  it('no genera clave para columnas sin encabezado', async () => {
    const ruta = await crearFixture([
      {
        nombre: 'Polizas',
        encabezados: ['Nro. Pol.'],
        filas: [['1240112/1', 'valor-sin-columna']],
      },
    ])
    rutasABorrar.push(ruta)

    const filas = await extraerTodo(parser, ruta, configBase)

    expect(Object.keys(filas[0]?.valores ?? {})).toEqual(['Nro. Pol.'])
  })

  it('procesa un archivo grande en streaming sin que el heap crezca proporcional al archivo', async () => {
    const totalFilas = 20_000
    const ruta = await crearFixture([
      {
        nombre: 'Polizas',
        encabezados: ['Nro. Pol.', 'Asegurado', 'Prima'],
        filas: Array.from({ length: totalFilas }, (_, i) => [
          `${String(1_000_000 + i)}/0`,
          `Cliente ${String(i)}`,
          10_000 + i,
        ]),
      },
    ])
    rutasABorrar.push(ruta)

    if (globalThis.gc) {
      globalThis.gc()
    }
    const heapAntes = process.memoryUsage().heapUsed

    let contador = 0
    let maxHeapDurante = 0
    for await (const _fila of parser.extract(createReadStream(ruta), configBase)) {
      contador += 1
      if (contador % 2000 === 0) {
        maxHeapDurante = Math.max(maxHeapDurante, process.memoryUsage().heapUsed)
      }
    }

    expect(contador).toBe(totalFilas)
    // El archivo entero materializado como filas en memoria pesaría varias
    // decenas de MB (20k objetos con arrays intermedios). Streaming real
    // mantiene el heap acotado muy por debajo de eso.
    const crecimientoMb = (maxHeapDurante - heapAntes) / (1024 * 1024)
    expect(crecimientoMb).toBeLessThan(60)
  }, 30_000)
})
