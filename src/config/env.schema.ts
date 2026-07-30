import { z } from 'zod'

/**
 * Sólo las variables que el código YA consume. Cada módulo nuevo que necesite
 * una variable de entorno la suma acá antes de leerla — así nunca hay una
 * variable leída de `process.env` que no esté validada ni documentada.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(3001),
  API_PREFIX: z.string().trim().min(1).default('api'),
  CORS_ORIGINS: z.string().trim().min(1),
  DATABASE_URL: z.url(),

  // --- Autenticación ---------------------------------------------------------
  JWT_ACCESS_SECRET: z.string().min(32, 'Mínimo 32 caracteres'),
  JWT_REFRESH_SECRET: z.string().min(32, 'Mínimo 32 caracteres'),
  JWT_ACCESS_TTL: z
    .string()
    .trim()
    .regex(/^\d+[smhd]$/, 'Formato esperado: número + s|m|h|d (ej: 15m)')
    .default('15m'),
  JWT_REFRESH_TTL: z
    .string()
    .trim()
    .regex(/^\d+[smhd]$/, 'Formato esperado: número + s|m|h|d (ej: 7d)')
    .default('7d'),
  REFRESH_COOKIE_NAME: z.string().trim().min(1).default('mf_rt'),
  REFRESH_COOKIE_SECURE: z.stringbool().default(false),
  REFRESH_COOKIE_DOMAIN: z.string().trim().min(1),

  // --- Rate limiting -----------------------------------------------------------
  THROTTLE_TTL_MS: z.coerce.number().int().positive().default(60000),
  THROTTLE_LIMIT: z.coerce.number().int().positive().default(120),
  THROTTLE_LOGIN_TTL_MS: z.coerce.number().int().positive().default(900000),
  THROTTLE_LOGIN_LIMIT: z.coerce.number().int().positive().default(5),

  // --- Features (decisiones abiertas, ver CLAUDE.md) --------------------------
  // D1: la maqueta no muestra prima/premio/comisión. El dato se persiste
  // siempre; este flag sólo controla si la API lo serializa.
  FEATURE_DATOS_FINANCIEROS: z.stringbool().default(false),
})

export type EnvSchema = z.infer<typeof envSchema>

/**
 * Falla al arrancar, no en el primer request. La app no levanta si falta o
 * está mal formada una variable requerida (CLAUDE.md: "la app no arranca si
 * falta una variable").
 */
export class EnvInvalidoError extends Error {
  constructor(zodError: z.ZodError) {
    super(`Variables de entorno inválidas:\n${z.prettifyError(zodError)}`)
    this.name = 'EnvInvalidoError'
  }
}

export function validarEnv(config: Record<string, unknown>): EnvSchema {
  const resultado = envSchema.safeParse(config)
  if (!resultado.success) {
    throw new EnvInvalidoError(resultado.error)
  }
  return resultado.data
}
