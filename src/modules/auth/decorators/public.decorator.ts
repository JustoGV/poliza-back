import { SetMetadata } from '@nestjs/common'

export const IS_PUBLIC_KEY = 'esPublico'

/** Abre un endpoint puntual contra el JwtAuthGuard global. Seguro por defecto. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)
