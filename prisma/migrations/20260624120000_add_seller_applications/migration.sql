-- CreateTable
CREATE TABLE "seller_applications" (
    "id" TEXT NOT NULL,
    "nombre_completo" TEXT NOT NULL,
    "nombre_comercio" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "codigo_postal" TEXT NOT NULL,
    "provincia" TEXT NOT NULL,
    "localidad" TEXT NOT NULL,
    "rubro" TEXT NOT NULL,
    "cuit" TEXT NOT NULL,
    "cantidad_productos" TEXT NOT NULL,
    "link_mercadolibre" TEXT,
    "link_tiendanube" TEXT,
    "link_instagram" TEXT,
    "link_web" TEXT,
    "mensaje" TEXT,
    "acepta_contacto" BOOLEAN NOT NULL DEFAULT false,
    "confirma_datos" BOOLEAN NOT NULL DEFAULT false,
    "estado" TEXT NOT NULL DEFAULT 'Pendiente de revisión',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seller_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "seller_applications_email_key" ON "seller_applications"("email");

-- CreateIndex
CREATE UNIQUE INDEX "seller_applications_cuit_key" ON "seller_applications"("cuit");
