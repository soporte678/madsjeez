-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'PLATA', 'GOLD', 'PLATINUM');

-- CreateEnum
CREATE TYPE "ReputationColor" AS ENUM ('ROJO', 'NARANJA', 'AMARILLO', 'VERDE', 'VERDE_OSCURO');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "email_verified" TIMESTAMP(3),
    "image" TEXT,
    "role" "UserRole" DEFAULT 'USER',
    "is_seller" BOOLEAN DEFAULT false,
    "phone" TEXT,
    "address" JSONB,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "seller_bio" TEXT,
    "seller_banner_image" TEXT,
    "subscription_tier_id" TEXT,
    "reputation_color" "ReputationColor" DEFAULT 'VERDE',

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "parent_id" TEXT,
    "image_url" TEXT,
    "icon" TEXT,
    "is_active" BOOLEAN DEFAULT true,
    "sort_order" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "category_id" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "original_price" DECIMAL(12,2),
    "currency" TEXT DEFAULT 'ARS',
    "condition" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN DEFAULT true,
    "is_promoted" BOOLEAN DEFAULT false,
    "view_count" INTEGER DEFAULT 0,
    "sold_count" INTEGER DEFAULT 0,
    "images" JSONB DEFAULT '[]',
    "attributes" JSONB DEFAULT '{}',
    "shipping_methods" JSONB DEFAULT '[]',
    "shipping_free" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "buyer_id" TEXT,
    "seller_id" TEXT,
    "status" TEXT DEFAULT 'pending',
    "total_amount" DECIMAL(12,2) NOT NULL,
    "shipping_cost" DECIMAL(12,2),
    "shipping_address" JSONB,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
