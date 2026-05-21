-- Flash Shipping Options (configurable shipping tiers)
CREATE TABLE IF NOT EXISTS "flash_shipping_options" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 50,
    "coverage_type" TEXT NOT NULL,
    "radius_km" DOUBLE PRECISION,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "estimated_time" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flash_shipping_options_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "flash_shipping_options_code_key" ON "flash_shipping_options"("code");

-- Flash Zones
CREATE TABLE IF NOT EXISTS "flash_zones" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "city" TEXT,
    "province" TEXT,
    "postal_codes" TEXT[],
    "radius_km" DOUBLE PRECISION,
    "center_lat" DOUBLE PRECISION,
    "center_lng" DOUBLE PRECISION,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flash_zones_pkey" PRIMARY KEY ("id")
);

-- Flash Driver Settlements
CREATE TABLE IF NOT EXISTS "flash_driver_settlements" (
    "id" TEXT NOT NULL,
    "shipment_id" TEXT NOT NULL,
    "driver_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'mercadopago',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "external_payment_id" TEXT,
    "paid_at" TIMESTAMP(3),
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flash_driver_settlements_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "flash_driver_settlements_shipment_id_key" ON "flash_driver_settlements"("shipment_id");
CREATE INDEX IF NOT EXISTS "flash_driver_settlements_driver_id_idx" ON "flash_driver_settlements"("driver_id");
CREATE INDEX IF NOT EXISTS "flash_driver_settlements_status_idx" ON "flash_driver_settlements"("status");

ALTER TABLE "flash_driver_settlements" DROP CONSTRAINT IF EXISTS "flash_driver_settlements_shipment_id_fkey";
ALTER TABLE "flash_driver_settlements" ADD CONSTRAINT "flash_driver_settlements_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "flash_shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "flash_driver_settlements" DROP CONSTRAINT IF EXISTS "flash_driver_settlements_driver_id_fkey";
ALTER TABLE "flash_driver_settlements" ADD CONSTRAINT "flash_driver_settlements_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "flash_drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add new columns to flash_shipments
ALTER TABLE "flash_shipments" ADD COLUMN IF NOT EXISTS "shipping_tier" TEXT;
ALTER TABLE "flash_shipments" ADD COLUMN IF NOT EXISTS "shipping_price" DOUBLE PRECISION;
ALTER TABLE "flash_shipments" ADD COLUMN IF NOT EXISTS "priority_score" INTEGER NOT NULL DEFAULT 50;
ALTER TABLE "flash_shipments" ADD COLUMN IF NOT EXISTS "payment_status" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "flash_shipments" ADD COLUMN IF NOT EXISTS "settlement_id" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "flash_shipments_settlement_id_key" ON "flash_shipments"("settlement_id");

-- Add MercadoPago fields to flash_drivers
ALTER TABLE "flash_drivers" ADD COLUMN IF NOT EXISTS "mp_linked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "flash_drivers" ADD COLUMN IF NOT EXISTS "mp_account_ref" TEXT;
ALTER TABLE "flash_drivers" ADD COLUMN IF NOT EXISTS "mp_linked_at" TIMESTAMP(3);

-- Seed default shipping options
INSERT INTO "flash_shipping_options" ("id", "code", "name", "description", "price", "priority", "coverage_type", "radius_km", "is_active", "estimated_time", "created_at", "updated_at")
VALUES
  ('flash_local', 'flash_local', 'Flash Local — Entrega lo antes posible', 'Busca un conductor local disponible para retirar y entregar el pedido lo antes posible.', 3999, 70, 'local_radius', 15, true, 'Menos de 2 hs', NOW(), NOW()),
  ('flash_plus', 'flash_plus', 'Flash Plus — Prioridad alta', 'Entrega prioritaria con conductor local. El pedido pasa a los primeros lugares de la cola de asignación.', 5999, 100, 'priority_radius', 15, true, 'Menos de 1 hora', NOW(), NOW()),
  ('flash_normal', 'flash_normal', 'Flash Normal — Cobertura ampliada', 'Entrega Flash en radio más amplio, usando zonas estables predefinidas tipo bloques/logística flexible.', 6999, 50, 'flex_zone', NULL, true, 'Mismo día', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- Seed a default zone for AMBA
INSERT INTO "flash_zones" ("id", "name", "type", "city", "province", "postal_codes", "radius_km", "center_lat", "center_lng", "is_active", "created_at", "updated_at")
VALUES
  ('zone_amba', 'AMBA — Buenos Aires Metropolitana', 'flex', NULL, 'Buenos Aires', '{}', 50, -34.6037, -58.3816, true, NOW(), NOW())
ON CONFLICT DO NOTHING;
