import type { Aseguradora } from '@/generated/prisma/client'
import type { z } from 'zod'
import type { aseguradoraSchema } from './dto/aseguradora.dto'

/**
 * Frontera entre el modelo de persistencia (Prisma, con `Date` nativo) y el
 * contrato HTTP (JSON, sin tipo `Date`). Vive acá y no en el repositorio
 * porque el repositorio no sabe nada de HTTP; ni en el controller, porque
 * así el service test puede afirmar sobre la forma exacta de la respuesta.
 */
export function mapearAseguradora(aseguradora: Aseguradora): z.infer<typeof aseguradoraSchema> {
  return {
    id: aseguradora.id,
    codigoInterno: aseguradora.codigoInterno,
    nombre: aseguradora.nombre,
    cuit: aseguradora.cuit,
    activo: aseguradora.activo,
    creadoEn: aseguradora.creadoEn.toISOString(),
    actualizadoEn: aseguradora.actualizadoEn.toISOString(),
  }
}
