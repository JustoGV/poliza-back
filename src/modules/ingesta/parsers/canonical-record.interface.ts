import type { EstadoPoliza, TipoBien, TipoDocumento, TipoPersona } from '@/generated/prisma/client'

/**
 * Contrato de salida de TRANSFORM (nivel 1). Ver docs/MAPA_CANONICO.md §2-3
 * — ese documento es la fuente de verdad; este archivo es su espejo en tipos.
 * Todo campo nuevo se agrega ahí primero.
 *
 * Los niveles de obligatoriedad (C/R/O del mapa) NO se codifican acá con
 * `?:` — el parser puede no saber todavía si un campo requerido vino vacío.
 * Esa validación es responsabilidad de VALIDATE (paso 6, Zod), no del tipo.
 * Acá todo lo que puede faltar es `T | null`, nunca `undefined` ni `''`.
 */
export interface ClienteCanonico {
  tipoPersona: TipoPersona | null
  cuit: string | null
  tipoDocumento: TipoDocumento | null
  nroDocumento: string | null
  apellido: string | null
  nombre: string | null
  razonSocial: string | null
  fechaNacimiento: Date | null
  email: string | null
  telefono: string | null
  domicilioCalle: string | null
  domicilioLocalidad: string | null
  domicilioProvincia: string | null
  domicilioCp: string | null
}

export interface PolizaCanonica {
  numeroPoliza: string
  numeroEndoso: string
  ramoOrigen: string | null
  productoOrigen: string | null
  vigenciaDesde: Date | null
  vigenciaHasta: Date | null
  estadoOrigen: string | null
  prima: string | null
  premio: string | null
  comisionPct: string | null
  moneda: string | null
  formaPago: string | null
  productorCodigo: string | null
  /**
   * Homologado por nivel 2 (cascada de equivalencias). El parser nunca lo
   * completa — nace `undefined` acá y lo llena HOMOLOGAR (paso 5).
   */
  estado?: EstadoPoliza
}

export interface BienAseguradoCanonico {
  orden: number
  descripcion: string | null
  tipo: TipoBien | null
  patente: string | null
  marca: string | null
  modelo: string | null
  anio: number | null
  chasis: string | null
  motor: string | null
  sumaAsegurada: string | null
}

export interface CoberturaCanonica {
  codigoOrigen: string | null
  descripcion: string | null
  sumaAsegurada: string | null
  franquicia: string | null
}

export interface CanonicalRecord {
  cliente: ClienteCanonico
  poliza: PolizaCanonica
  bienes: BienAseguradoCanonico[]
  coberturas: CoberturaCanonica[]
  meta: {
    /** 1-based, fila del archivo (no del dataset acumulado). */
    nroFila: number
    /** La fila cruda completa. Va a poliza.raw_source. */
    raw: Record<string, unknown>
  }
}
