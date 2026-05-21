-- Flash Delivery System
-- CreateEnum
CREATE TYPE "FlashShipmentStatus" AS ENUM (
  'CREATED',
  'PAYMENT_CONFIRMED',
  'LABEL_GENERATED',
  'PACKAGE_READY',
  'ASSIGNED_TO_DRIVER',
  'IN_TRANSIT',
  'ARRIVED_AT_ADDRESS',
  'DELIVERED',
  'FAILED_ATTEMPT_1',
  'PENDING_VISIT_2',
  'FAILED_ATTEMPT_2',
  'PENDING_VISIT_3',
  'FAILED_ATTEMPT_3',
  'RETURNED_TO_SENDER',
  'CANCELLED'
);

-- CreateEnum
CREATE TYPE "FlashReceiverType" AS ENUM ('TITULAR', 'AUTHORIZED', 'FAMILY', 'NEIGHBOR');

-- CreateEnum
CREATE TYPE "FlashAttemptStatus" AS ENUM ('IN_PROGRESS', 'DELIVERED', 'CLIENT_NOT_FOUND');

-- Flash Driver (repartidor)
CREATE TABLE "flash_drivers" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "vehicle_type" TEXT NOT NULL DEFAULT 'moto',
  "license_plate" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "flash_drivers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "flash_drivers_user_id_key" ON "flash_drivers"("user_id");

-- Flash Shipment
CREATE TABLE "flash_shipments" (
  "id" TEXT NOT NULL,
  "order_id" TEXT NOT NULL,
  "qr_token" TEXT NOT NULL,
  "status" "FlashShipmentStatus" NOT NULL DEFAULT 'CREATED',
  "recipient_name" TEXT NOT NULL,
  "recipient_dni" TEXT NOT NULL,
  "recipient_phone" TEXT NOT NULL,
  "street" TEXT NOT NULL,
  "street_number" TEXT NOT NULL,
  "floor" TEXT,
  "apartment" TEXT,
  "between_street1" TEXT NOT NULL,
  "between_street2" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "province" TEXT NOT NULL,
  "postal_code" TEXT NOT NULL,
  "label_url" TEXT,
  "label_print_count" INTEGER NOT NULL DEFAULT 0,
  "estimated_delivery" TIMESTAMP(3),
  "driver_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "flash_shipments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "flash_shipments_order_id_key" ON "flash_shipments"("order_id");
CREATE UNIQUE INDEX "flash_shipments_qr_token_key" ON "flash_shipments"("qr_token");

-- Authorized recipients
CREATE TABLE "flash_authorized_recipients" (
  "id" TEXT NOT NULL,
  "shipment_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "dni" TEXT NOT NULL,
  "relationship" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "flash_authorized_recipients_pkey" PRIMARY KEY ("id")
);

-- Delivery attempts
CREATE TABLE "flash_delivery_attempts" (
  "id" TEXT NOT NULL,
  "shipment_id" TEXT NOT NULL,
  "driver_id" TEXT NOT NULL,
  "attempt_number" INTEGER NOT NULL,
  "arrived_at" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "status" "FlashAttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "flash_delivery_attempts_pkey" PRIMARY KEY ("id")
);

-- Attempt photos
CREATE TABLE "flash_attempt_photos" (
  "id" TEXT NOT NULL,
  "attempt_id" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "flash_attempt_photos_pkey" PRIMARY KEY ("id")
);

-- Delivery proof
CREATE TABLE "flash_delivery_proofs" (
  "id" TEXT NOT NULL,
  "shipment_id" TEXT NOT NULL,
  "attempt_id" TEXT NOT NULL,
  "receiver_type" "FlashReceiverType" NOT NULL,
  "receiver_name" TEXT NOT NULL,
  "receiver_dni" TEXT NOT NULL,
  "photos" TEXT[],
  "signed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "flash_delivery_proofs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "flash_delivery_proofs_shipment_id_key" ON "flash_delivery_proofs"("shipment_id");
CREATE UNIQUE INDEX "flash_delivery_proofs_attempt_id_key" ON "flash_delivery_proofs"("attempt_id");

-- Audit log
CREATE TABLE "flash_audit_logs" (
  "id" TEXT NOT NULL,
  "shipment_id" TEXT NOT NULL,
  "actor_id" TEXT NOT NULL,
  "actor_role" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "previous_status" "FlashShipmentStatus",
  "new_status" "FlashShipmentStatus",
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "flash_audit_logs_pkey" PRIMARY KEY ("id")
);

-- Foreign keys
ALTER TABLE "flash_drivers" ADD CONSTRAINT "flash_drivers_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "flash_shipments" ADD CONSTRAINT "flash_shipments_order_id_fkey"
  FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "flash_shipments" ADD CONSTRAINT "flash_shipments_driver_id_fkey"
  FOREIGN KEY ("driver_id") REFERENCES "flash_drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "flash_authorized_recipients" ADD CONSTRAINT "flash_authorized_recipients_shipment_id_fkey"
  FOREIGN KEY ("shipment_id") REFERENCES "flash_shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "flash_delivery_attempts" ADD CONSTRAINT "flash_delivery_attempts_shipment_id_fkey"
  FOREIGN KEY ("shipment_id") REFERENCES "flash_shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "flash_delivery_attempts" ADD CONSTRAINT "flash_delivery_attempts_driver_id_fkey"
  FOREIGN KEY ("driver_id") REFERENCES "flash_drivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "flash_attempt_photos" ADD CONSTRAINT "flash_attempt_photos_attempt_id_fkey"
  FOREIGN KEY ("attempt_id") REFERENCES "flash_delivery_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "flash_delivery_proofs" ADD CONSTRAINT "flash_delivery_proofs_shipment_id_fkey"
  FOREIGN KEY ("shipment_id") REFERENCES "flash_shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "flash_delivery_proofs" ADD CONSTRAINT "flash_delivery_proofs_attempt_id_fkey"
  FOREIGN KEY ("attempt_id") REFERENCES "flash_delivery_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "flash_audit_logs" ADD CONSTRAINT "flash_audit_logs_shipment_id_fkey"
  FOREIGN KEY ("shipment_id") REFERENCES "flash_shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
