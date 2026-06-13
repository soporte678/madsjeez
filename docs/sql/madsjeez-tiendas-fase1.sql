-- ════════════════════════════════════════════════════════════════════════
-- Madsjeez Tiendas — Fase 1 (migración ADITIVA). NO aplicada automáticamente.
--
-- Crea las tablas del store builder y hace backfill 1:1 de los vendedores
-- actuales (un Store por cada user con isSeller + store_slug). No toca
-- products, users ni el storefront actual.
--
-- Cómo aplicar (elegí una):
--   A) Recomendado (migración trackeada): en un entorno dev con shadow DB,
--      `npx prisma migrate dev --name madsjeez_tiendas`  → commitear la carpeta
--      generada en prisma/migrations → en deploy corre `prisma migrate deploy`.
--   B) Manual: pegar este SQL en el SQL editor de Supabase (o
--      `npx prisma db execute --file docs/sql/madsjeez-tiendas-fase1.sql`).
--
-- Idempotente en lo posible (IF NOT EXISTS / ON CONFLICT). Revisar antes de correr.
-- ════════════════════════════════════════════════════════════════════════

-- ── Enums ────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "StoreDomainKind" AS ENUM ('internal','subdomain','custom');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "StoreDnsStatus" AS ENUM ('pending','dns_pending','verified','failed','disconnected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "StoreSslStatus" AS ENUM ('pending','ssl_pending','active','failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── stores ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "stores" (
  "id"                  TEXT PRIMARY KEY,
  "owner_user_id"       TEXT NOT NULL,
  "name"                TEXT NOT NULL,
  "slug"                TEXT NOT NULL,
  "subdomain"           TEXT,
  "custom_domain"       TEXT,
  "primary_domain_type" "StoreDomainKind" NOT NULL DEFAULT 'internal',
  "logo_url"            TEXT,
  "banner_url"          TEXT,
  "description"         TEXT,
  "short_description"   TEXT,
  "whatsapp"            TEXT,
  "email"               TEXT,
  "province"            TEXT,
  "city"                TEXT,
  "address"             TEXT,
  "category"            TEXT,
  "theme_id"            TEXT,
  "primary_color"       TEXT,
  "secondary_color"     TEXT,
  "font"                TEXT,
  "instagram"           TEXT,
  "facebook"            TEXT,
  "website"             TEXT,
  "seo_title"           TEXT,
  "seo_description"     TEXT,
  "og_image_url"        TEXT,
  "is_active"           BOOLEAN NOT NULL DEFAULT false,
  "is_verified"         BOOLEAN NOT NULL DEFAULT false,
  "created_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "stores_owner_user_id_fkey" FOREIGN KEY ("owner_user_id")
    REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "stores_owner_user_id_key" ON "stores"("owner_user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "stores_slug_key"          ON "stores"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "stores_subdomain_key"     ON "stores"("subdomain");
CREATE UNIQUE INDEX IF NOT EXISTS "stores_custom_domain_key" ON "stores"("custom_domain");
CREATE INDEX        IF NOT EXISTS "stores_is_active_idx"     ON "stores"("is_active");

-- ── store_themes ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "store_themes" (
  "id"                   TEXT PRIMARY KEY,
  "store_id"             TEXT NOT NULL,
  "layout"               TEXT NOT NULL DEFAULT 'classic',
  "primary_color"        TEXT NOT NULL DEFAULT '#1d4ed8',
  "secondary_color"      TEXT NOT NULL DEFAULT '#3b82f6',
  "logo_position"        TEXT NOT NULL DEFAULT 'left',
  "banner_style"         TEXT NOT NULL DEFAULT 'full',
  "product_card_style"   TEXT NOT NULL DEFAULT 'card',
  "show_whatsapp_button" BOOLEAN NOT NULL DEFAULT true,
  "show_location"        BOOLEAN NOT NULL DEFAULT true,
  "show_social_links"    BOOLEAN NOT NULL DEFAULT true,
  "created_at"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "store_themes_store_id_fkey" FOREIGN KEY ("store_id")
    REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "store_themes_store_id_key" ON "store_themes"("store_id");

-- ── store_domains ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "store_domains" (
  "id"                 TEXT PRIMARY KEY,
  "store_id"           TEXT NOT NULL,
  "domain"             TEXT NOT NULL,
  "type"               "StoreDomainKind" NOT NULL,
  "verification_token" TEXT NOT NULL,
  "dns_status"         "StoreDnsStatus" NOT NULL DEFAULT 'pending',
  "ssl_status"         "StoreSslStatus" NOT NULL DEFAULT 'pending',
  "is_primary"         BOOLEAN NOT NULL DEFAULT false,
  "created_at"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "verified_at"        TIMESTAMP(3),
  "last_checked_at"    TIMESTAMP(3),
  CONSTRAINT "store_domains_store_id_fkey" FOREIGN KEY ("store_id")
    REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "store_domains_domain_key" ON "store_domains"("domain");
CREATE INDEX        IF NOT EXISTS "store_domains_store_id_idx" ON "store_domains"("store_id");

-- ── store_categories ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "store_categories" (
  "id"         TEXT PRIMARY KEY,
  "store_id"   TEXT NOT NULL,
  "name"       TEXT NOT NULL,
  "slug"       TEXT NOT NULL,
  "order"      INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "store_categories_store_id_fkey" FOREIGN KEY ("store_id")
    REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "store_categories_store_id_slug_key" ON "store_categories"("store_id","slug");
CREATE INDEX        IF NOT EXISTS "store_categories_store_id_idx"      ON "store_categories"("store_id");

-- ── store_product_settings ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "store_product_settings" (
  "id"                TEXT PRIMARY KEY,
  "store_id"          TEXT NOT NULL,
  "product_id"        TEXT NOT NULL,
  "store_category_id" TEXT,
  "featured"          BOOLEAN NOT NULL DEFAULT false,
  "hidden"            BOOLEAN NOT NULL DEFAULT false,
  "sort_order"        INTEGER NOT NULL DEFAULT 0,
  "created_at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "store_product_settings_store_id_fkey" FOREIGN KEY ("store_id")
    REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "store_product_settings_product_id_fkey" FOREIGN KEY ("product_id")
    REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "store_product_settings_store_id_product_id_key" ON "store_product_settings"("store_id","product_id");
CREATE INDEX        IF NOT EXISTS "store_product_settings_store_id_idx"   ON "store_product_settings"("store_id");
CREATE INDEX        IF NOT EXISTS "store_product_settings_product_id_idx" ON "store_product_settings"("product_id");

-- ── Backfill: un Store por vendedor actual con store_slug ─────────────────
-- Las tiendas backfilleadas quedan activas y verificadas (ya eran públicas).
INSERT INTO "stores" ("id","owner_user_id","name","slug","is_active","is_verified","created_at","updated_at")
SELECT
  gen_random_uuid()::text,
  u."id",
  COALESCE(NULLIF(u."sellerName", ''), NULLIF(u."name", ''), u."store_slug"),
  u."store_slug",
  true,
  true,
  now(),
  now()
FROM "users" u
WHERE u."isSeller" = true
  AND u."store_slug" IS NOT NULL
ON CONFLICT ("slug") DO NOTHING;
