-- =============================================================================
-- BLOQUE ESCRITO A MANO — no lo genera Prisma, no lo borres al regenerar.
--
-- Prisma no sabe expresar: extensiones, columnas GENERATED, índices parciales,
-- índices con operator class, ni triggers. Todo eso vive acá.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- unaccent() NO es IMMUTABLE: depende del diccionario activo, que puede cambiar.
-- Una columna GENERATED exige IMMUTABLE, así que sin este wrapper la migración
-- falla con "generation expression is not immutable".
--
-- El truco es la forma de dos argumentos: al fijar el diccionario explícitamente
-- la función pasa a ser determinística y marcarla IMMUTABLE es correcto.
CREATE OR REPLACE FUNCTION mf_unaccent(texto text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
STRICT
AS $$ SELECT public.unaccent('public.unaccent'::regdictionary, texto) $$;

COMMENT ON FUNCTION mf_unaccent(text) IS
  'Wrapper IMMUTABLE de unaccent. Requerido por equivalencia.descripcion_normalizada.';

-- CreateEnum
CREATE TYPE "tipo_persona" AS ENUM ('FISICA', 'JURIDICA');

-- CreateEnum
CREATE TYPE "tipo_documento" AS ENUM ('DNI', 'LE', 'LC', 'CI', 'PASAPORTE', 'CUIT', 'CUIL');

-- CreateEnum
CREATE TYPE "tipo_categoria" AS ENUM ('RAMO', 'PRODUCTO', 'ESTADO', 'MOVIMIENTO');

-- CreateEnum
CREATE TYPE "origen_equivalencia" AS ENUM ('AUTO_CODIGO', 'AUTO_NOMBRE', 'AUTO_FUZZY', 'MANUAL');

-- CreateEnum
CREATE TYPE "estado_poliza" AS ENUM ('VIGENTE', 'NO_VIGENTE');

-- CreateEnum
CREATE TYPE "tipo_movimiento" AS ENUM ('NUEVA', 'RENOVACION', 'VENCIDA_BAJA', 'SIN_CAMBIOS');

-- CreateEnum
CREATE TYPE "tipo_bien" AS ENUM ('VEHICULO', 'INMUEBLE', 'PERSONA', 'OTRO');

-- CreateEnum
CREATE TYPE "tipo_archivo" AS ENUM ('XLSX', 'XLS', 'CSV', 'TXT');

-- CreateEnum
CREATE TYPE "estado_importacion" AS ENUM ('PENDIENTE', 'PROCESANDO', 'COMPLETADA', 'COMPLETADA_CON_ERRORES', 'FALLIDA');

-- CreateEnum
CREATE TYPE "rol_usuario" AS ENUM ('ADMIN', 'OPERADOR', 'CONSULTA');

-- CreateEnum
CREATE TYPE "entidad_seguimiento" AS ENUM ('POLIZA', 'CLIENTE');

-- CreateEnum
CREATE TYPE "estado_seguimiento" AS ENUM ('PENDIENTE', 'EN_CURSO', 'RESUELTO', 'DESCARTADO');

-- CreateEnum
CREATE TYPE "accion_audit" AS ENUM ('CREAR', 'ACTUALIZAR', 'BAJA', 'LOGIN', 'LOGIN_FALLIDO', 'EXPORTAR', 'IMPORTAR', 'HOMOLOGAR');

-- CreateTable
CREATE TABLE "aseguradora" (
    "id" TEXT NOT NULL,
    "codigo_interno" VARCHAR(10) NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "cuit" VARCHAR(11),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "aseguradora_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cliente" (
    "id" TEXT NOT NULL,
    "tipo_persona" "tipo_persona",
    "cuit" VARCHAR(11),
    "tipo_documento" "tipo_documento",
    "nro_documento" VARCHAR(20),
    "apellido" VARCHAR(120),
    "nombre" VARCHAR(120),
    "razon_social" VARCHAR(200),
    "nombre_completo" VARCHAR(320) NOT NULL,
    "fecha_nacimiento" DATE,
    "email" VARCHAR(200),
    "telefono" VARCHAR(50),
    "domicilio_calle" VARCHAR(200),
    "domicilio_localidad" VARCHAR(120),
    "domicilio_provincia" VARCHAR(80),
    "domicilio_cp" VARCHAR(12),
    "requiere_revision" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poliza" (
    "id" TEXT NOT NULL,
    "aseguradora_id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "numero_poliza" VARCHAR(60) NOT NULL,
    "numero_endoso" VARCHAR(20) NOT NULL DEFAULT '0',
    "ramo_id" TEXT,
    "producto_id" TEXT,
    "ramo_origen" VARCHAR(200),
    "producto_origen" VARCHAR(200),
    "vigencia_desde" DATE,
    "vigencia_hasta" DATE,
    "estado" "estado_poliza" NOT NULL DEFAULT 'VIGENTE',
    "estado_origen" VARCHAR(80),
    "prima" DECIMAL(15,2),
    "premio" DECIMAL(15,2),
    "comision_pct" DECIMAL(7,4),
    "moneda" CHAR(3) NOT NULL DEFAULT 'ARS',
    "forma_pago" VARCHAR(60),
    "productor_codigo" VARCHAR(40),
    "sin_homologar" BOOLEAN NOT NULL DEFAULT true,
    "posible_baja" BOOLEAN NOT NULL DEFAULT false,
    "raw_source" JSONB,
    "importacion_id" TEXT,
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "poliza_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bien_asegurado" (
    "id" TEXT NOT NULL,
    "poliza_id" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 1,
    "descripcion" VARCHAR(300),
    "tipo" "tipo_bien",
    "patente" VARCHAR(15),
    "marca" VARCHAR(80),
    "modelo" VARCHAR(120),
    "anio" SMALLINT,
    "chasis" VARCHAR(40),
    "motor" VARCHAR(40),
    "suma_asegurada" DECIMAL(15,2),
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bien_asegurado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cobertura" (
    "id" TEXT NOT NULL,
    "poliza_id" TEXT NOT NULL,
    "codigo_origen" VARCHAR(60),
    "descripcion" VARCHAR(300),
    "suma_asegurada" DECIMAL(15,2),
    "franquicia" DECIMAL(15,2),
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cobertura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categoria_canonica" (
    "id" TEXT NOT NULL,
    "tipo" "tipo_categoria" NOT NULL,
    "codigo" VARCHAR(40) NOT NULL,
    "descripcion" VARCHAR(200) NOT NULL,
    "padre_id" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categoria_canonica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equivalencia" (
    "id" TEXT NOT NULL,
    "categoria_canonica_id" TEXT NOT NULL,
    "aseguradora_id" TEXT NOT NULL,
    "tipo" "tipo_categoria" NOT NULL,
    "codigo_externo" VARCHAR(120),
    "descripcion_externa" VARCHAR(300),
    -- GENERADA: la aplicación NUNCA la escribe. Replica exactamente normalizar()
    -- del resolvedor —sin acentos, mayúsculas, sólo alfanumérico, espacios
    -- colapsados, sin bordes—. Vive en la base y no en la app justamente para
    -- que las dos no puedan desincronizarse.
    "descripcion_normalizada" VARCHAR(300) GENERATED ALWAYS AS (
      btrim(
        upper(
          regexp_replace(
            mf_unaccent(coalesce("descripcion_externa", '')),
            '[^a-zA-Z0-9]+', ' ', 'g'
          )
        )
      )
    ) STORED,
    "flg_baja" SMALLINT NOT NULL DEFAULT 0,
    "origen" "origen_equivalencia" NOT NULL,
    "confianza" SMALLINT NOT NULL,
    "resuelto_por" TEXT,
    "resuelto_en" TIMESTAMPTZ(6),
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "equivalencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perfil_importacion" (
    "id" TEXT NOT NULL,
    "aseguradora_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "nombre" VARCHAR(120) NOT NULL,
    "parser_key" VARCHAR(60) NOT NULL,
    "tipo_archivo" "tipo_archivo" NOT NULL,
    "nombre_hoja" VARCHAR(120),
    "fila_encabezado" INTEGER NOT NULL DEFAULT 1,
    "delimitador" VARCHAR(4),
    "encoding" VARCHAR(20) NOT NULL DEFAULT 'utf8',
    "es_snapshot" BOOLEAN NOT NULL DEFAULT true,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "perfil_importacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regla_homologacion" (
    "id" TEXT NOT NULL,
    "perfil_id" TEXT NOT NULL,
    "columna_origen" VARCHAR(200) NOT NULL,
    "campo_destino" VARCHAR(80) NOT NULL,
    "transformacion" VARCHAR(60),
    "requerido" BOOLEAN NOT NULL DEFAULT false,
    "valor_default" VARCHAR(200),
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "regla_homologacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "importacion" (
    "id" TEXT NOT NULL,
    "perfil_id" TEXT NOT NULL,
    "archivo_hash" CHAR(64) NOT NULL,
    "storage_key" VARCHAR(400) NOT NULL,
    "nombre_archivo" VARCHAR(300) NOT NULL,
    "periodo" VARCHAR(7),
    "estado" "estado_importacion" NOT NULL DEFAULT 'PENDIENTE',
    "filas_leidas" INTEGER NOT NULL DEFAULT 0,
    "filas_ok" INTEGER NOT NULL DEFAULT 0,
    "filas_error" INTEGER NOT NULL DEFAULT 0,
    "polizas_nuevas" INTEGER NOT NULL DEFAULT 0,
    "polizas_actualizadas" INTEGER NOT NULL DEFAULT 0,
    "polizas_sin_homologar" INTEGER NOT NULL DEFAULT 0,
    "usuario_id" TEXT,
    "iniciado_en" TIMESTAMPTZ(6),
    "finalizado_en" TIMESTAMPTZ(6),
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "importacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "importacion_error" (
    "id" TEXT NOT NULL,
    "importacion_id" TEXT NOT NULL,
    "nro_fila" INTEGER NOT NULL,
    "columna" VARCHAR(200),
    "codigo_error" VARCHAR(60) NOT NULL,
    "mensaje" VARCHAR(500) NOT NULL,
    "payload_crudo" JSONB,
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "importacion_error_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poliza_historial" (
    "id" TEXT NOT NULL,
    "poliza_id" TEXT NOT NULL,
    "importacion_id" TEXT,
    "campo" VARCHAR(80) NOT NULL,
    "valor_anterior" VARCHAR(500),
    "valor_nuevo" VARCHAR(500),
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "poliza_historial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poliza_movimiento" (
    "id" TEXT NOT NULL,
    "poliza_id" TEXT NOT NULL,
    "importacion_id" TEXT,
    "tipo" "tipo_movimiento" NOT NULL,
    "detalle" VARCHAR(300),
    "detectado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "poliza_movimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(200) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "rol" "rol_usuario" NOT NULL DEFAULT 'OPERADOR',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "ultimo_login_en" TIMESTAMPTZ(6),
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_token" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "familia_id" TEXT NOT NULL,
    "revocado" BOOLEAN NOT NULL DEFAULT false,
    "expira_en" TIMESTAMPTZ(6) NOT NULL,
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT,
    "accion" "accion_audit" NOT NULL,
    "entidad_tipo" VARCHAR(60) NOT NULL,
    "entidad_id" TEXT,
    "datos" JSONB,
    "ip" VARCHAR(45),
    "user_agent" VARCHAR(400),
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seguimiento" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "entidad_tipo" "entidad_seguimiento" NOT NULL,
    "entidad_id" TEXT NOT NULL,
    "nota" VARCHAR(2000) NOT NULL,
    "estado" "estado_seguimiento" NOT NULL DEFAULT 'PENDIENTE',
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "seguimiento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "aseguradora_codigo_interno_key" ON "aseguradora"("codigo_interno");

-- CreateIndex
CREATE INDEX "aseguradora_activo_idx" ON "aseguradora"("activo");

-- CreateIndex
CREATE UNIQUE INDEX "cliente_cuit_key" ON "cliente"("cuit");

-- CreateIndex
CREATE INDEX "cliente_nombre_completo_idx" ON "cliente"("nombre_completo");

-- CreateIndex
CREATE INDEX "cliente_requiere_revision_idx" ON "cliente"("requiere_revision");

-- CreateIndex
CREATE UNIQUE INDEX "cliente_tipo_documento_nro_documento_key" ON "cliente"("tipo_documento", "nro_documento");

-- CreateIndex
CREATE INDEX "poliza_cliente_id_idx" ON "poliza"("cliente_id");

-- CreateIndex
CREATE INDEX "poliza_estado_idx" ON "poliza"("estado");

-- CreateIndex
CREATE INDEX "poliza_vigencia_hasta_idx" ON "poliza"("vigencia_hasta");

-- CreateIndex
CREATE INDEX "poliza_sin_homologar_idx" ON "poliza"("sin_homologar");

-- CreateIndex
CREATE INDEX "poliza_aseguradora_id_ramo_id_idx" ON "poliza"("aseguradora_id", "ramo_id");

-- CreateIndex
CREATE INDEX "poliza_producto_id_idx" ON "poliza"("producto_id");

-- CreateIndex
CREATE UNIQUE INDEX "poliza_aseguradora_id_numero_poliza_numero_endoso_key" ON "poliza"("aseguradora_id", "numero_poliza", "numero_endoso");

-- CreateIndex
CREATE INDEX "bien_asegurado_poliza_id_idx" ON "bien_asegurado"("poliza_id");

-- CreateIndex
CREATE INDEX "bien_asegurado_patente_idx" ON "bien_asegurado"("patente");

-- CreateIndex
CREATE INDEX "cobertura_poliza_id_idx" ON "cobertura"("poliza_id");

-- CreateIndex
CREATE INDEX "categoria_canonica_tipo_activo_idx" ON "categoria_canonica"("tipo", "activo");

-- CreateIndex
CREATE UNIQUE INDEX "categoria_canonica_tipo_codigo_key" ON "categoria_canonica"("tipo", "codigo");

-- CreateIndex
CREATE INDEX "equivalencia_aseguradora_id_tipo_codigo_externo_idx" ON "equivalencia"("aseguradora_id", "tipo", "codigo_externo");

-- CreateIndex
CREATE INDEX "equivalencia_categoria_canonica_id_idx" ON "equivalencia"("categoria_canonica_id");

-- CreateIndex
CREATE INDEX "perfil_importacion_parser_key_idx" ON "perfil_importacion"("parser_key");

-- CreateIndex
CREATE UNIQUE INDEX "perfil_importacion_aseguradora_id_version_key" ON "perfil_importacion"("aseguradora_id", "version");

-- CreateIndex
CREATE UNIQUE INDEX "regla_homologacion_perfil_id_campo_destino_key" ON "regla_homologacion"("perfil_id", "campo_destino");

-- CreateIndex
CREATE UNIQUE INDEX "importacion_archivo_hash_key" ON "importacion"("archivo_hash");

-- CreateIndex
CREATE INDEX "importacion_perfil_id_creado_en_idx" ON "importacion"("perfil_id", "creado_en");

-- CreateIndex
CREATE INDEX "importacion_estado_idx" ON "importacion"("estado");

-- CreateIndex
CREATE INDEX "importacion_error_importacion_id_nro_fila_idx" ON "importacion_error"("importacion_id", "nro_fila");

-- CreateIndex
CREATE INDEX "poliza_historial_poliza_id_creado_en_idx" ON "poliza_historial"("poliza_id", "creado_en");

-- CreateIndex
CREATE INDEX "poliza_movimiento_poliza_id_idx" ON "poliza_movimiento"("poliza_id");

-- CreateIndex
CREATE INDEX "poliza_movimiento_importacion_id_tipo_idx" ON "poliza_movimiento"("importacion_id", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_token_token_hash_key" ON "refresh_token"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_token_usuario_id_idx" ON "refresh_token"("usuario_id");

-- CreateIndex
CREATE INDEX "refresh_token_familia_id_idx" ON "refresh_token"("familia_id");

-- CreateIndex
CREATE INDEX "refresh_token_expira_en_idx" ON "refresh_token"("expira_en");

-- CreateIndex
CREATE INDEX "audit_log_entidad_tipo_entidad_id_idx" ON "audit_log"("entidad_tipo", "entidad_id");

-- CreateIndex
CREATE INDEX "audit_log_usuario_id_creado_en_idx" ON "audit_log"("usuario_id", "creado_en");

-- CreateIndex
CREATE INDEX "seguimiento_entidad_tipo_entidad_id_idx" ON "seguimiento"("entidad_tipo", "entidad_id");

-- CreateIndex
CREATE INDEX "seguimiento_estado_idx" ON "seguimiento"("estado");

-- AddForeignKey
ALTER TABLE "poliza" ADD CONSTRAINT "poliza_aseguradora_id_fkey" FOREIGN KEY ("aseguradora_id") REFERENCES "aseguradora"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poliza" ADD CONSTRAINT "poliza_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poliza" ADD CONSTRAINT "poliza_ramo_id_fkey" FOREIGN KEY ("ramo_id") REFERENCES "categoria_canonica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poliza" ADD CONSTRAINT "poliza_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "categoria_canonica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poliza" ADD CONSTRAINT "poliza_importacion_id_fkey" FOREIGN KEY ("importacion_id") REFERENCES "importacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bien_asegurado" ADD CONSTRAINT "bien_asegurado_poliza_id_fkey" FOREIGN KEY ("poliza_id") REFERENCES "poliza"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cobertura" ADD CONSTRAINT "cobertura_poliza_id_fkey" FOREIGN KEY ("poliza_id") REFERENCES "poliza"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categoria_canonica" ADD CONSTRAINT "categoria_canonica_padre_id_fkey" FOREIGN KEY ("padre_id") REFERENCES "categoria_canonica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equivalencia" ADD CONSTRAINT "equivalencia_categoria_canonica_id_fkey" FOREIGN KEY ("categoria_canonica_id") REFERENCES "categoria_canonica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equivalencia" ADD CONSTRAINT "equivalencia_aseguradora_id_fkey" FOREIGN KEY ("aseguradora_id") REFERENCES "aseguradora"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equivalencia" ADD CONSTRAINT "equivalencia_resuelto_por_fkey" FOREIGN KEY ("resuelto_por") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perfil_importacion" ADD CONSTRAINT "perfil_importacion_aseguradora_id_fkey" FOREIGN KEY ("aseguradora_id") REFERENCES "aseguradora"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regla_homologacion" ADD CONSTRAINT "regla_homologacion_perfil_id_fkey" FOREIGN KEY ("perfil_id") REFERENCES "perfil_importacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "importacion" ADD CONSTRAINT "importacion_perfil_id_fkey" FOREIGN KEY ("perfil_id") REFERENCES "perfil_importacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "importacion" ADD CONSTRAINT "importacion_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "importacion_error" ADD CONSTRAINT "importacion_error_importacion_id_fkey" FOREIGN KEY ("importacion_id") REFERENCES "importacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poliza_historial" ADD CONSTRAINT "poliza_historial_poliza_id_fkey" FOREIGN KEY ("poliza_id") REFERENCES "poliza"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poliza_historial" ADD CONSTRAINT "poliza_historial_importacion_id_fkey" FOREIGN KEY ("importacion_id") REFERENCES "importacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poliza_movimiento" ADD CONSTRAINT "poliza_movimiento_poliza_id_fkey" FOREIGN KEY ("poliza_id") REFERENCES "poliza"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poliza_movimiento" ADD CONSTRAINT "poliza_movimiento_importacion_id_fkey" FOREIGN KEY ("importacion_id") REFERENCES "importacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguimiento" ADD CONSTRAINT "seguimiento_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- =============================================================================
-- BLOQUE ESCRITO A MANO — índices y triggers que Prisma no puede generar.
-- =============================================================================

-- --- Cascada de homologación, paso 1: código externo exacto -----------------
-- La unicidad es POR ASEGURADORA. "REGIMEN GENERAL" es ART Convenio Colectivo
-- en Prevención ART y Retiro Individual en Prevención Retiro: el mismo texto,
-- dos categorías canónicas. Un UNIQUE(tipo, codigo_externo) haría imposible
-- cargar las dos. Ver docs/adr/0005.
--
-- Parcial (WHERE flg_baja = 0) porque nada se borra: una equivalencia dada de
-- baja tiene que poder convivir con su reemplazo.
CREATE UNIQUE INDEX "equivalencia_codigo_externo_uq"
    ON "equivalencia" ("aseguradora_id", "tipo", "codigo_externo")
    WHERE "flg_baja" = 0 AND "codigo_externo" IS NOT NULL;

-- --- Cascada, paso 2: descripción normalizada exacta ------------------------
-- NO es único a propósito: dos códigos distintos de la misma aseguradora pueden
-- compartir descripción legítimamente. Cuando hay empate, el resolvedor ordena
-- por confianza y desempata determinísticamente.
CREATE INDEX "equivalencia_desc_norm_idx"
    ON "equivalencia" ("aseguradora_id", "tipo", "descripcion_normalizada")
    WHERE "flg_baja" = 0;

-- --- Cascada, paso 3: similitud trigram -------------------------------------
-- El operador % y similarity() usan este índice. El umbral se fija por
-- transacción con SET LOCAL pg_trgm.similarity_threshold, tomando el valor de
-- HOMOLOGACION_FUZZY_THRESHOLD. Nunca hardcodeado.
CREATE INDEX "equivalencia_desc_norm_trgm_idx"
    ON "equivalencia" USING gin ("descripcion_normalizada" gin_trgm_ops)
    WHERE "flg_baja" = 0;

-- --- Búsqueda de clientes por nombre ----------------------------------------
CREATE INDEX "cliente_nombre_completo_trgm_idx"
    ON "cliente" USING gin ("nombre_completo" gin_trgm_ops);

-- --- audit_log es solo-append -----------------------------------------------
-- Regla 5: nada se borra. Un log de auditoría que se puede editar no es un log
-- de auditoría. Se aplica en la base, no por convención: ni la aplicación ni
-- una sesión de psql pueden saltearlo.
CREATE OR REPLACE FUNCTION mf_audit_log_solo_append()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'audit_log es solo-append: % no esta permitido', TG_OP
        USING ERRCODE = 'restrict_violation';
END;
$$;

CREATE TRIGGER "audit_log_solo_append"
    BEFORE UPDATE OR DELETE ON "audit_log"
    FOR EACH ROW EXECUTE FUNCTION mf_audit_log_solo_append();

CREATE TRIGGER "audit_log_sin_truncate"
    BEFORE TRUNCATE ON "audit_log"
    FOR EACH STATEMENT EXECUTE FUNCTION mf_audit_log_solo_append();
