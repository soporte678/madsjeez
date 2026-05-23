/**
 * Script: Eliminar publicaciones sin imágenes de un vendedor
 * Uso:    npx tsx scripts/delete-products-no-images.ts
 *
 * Por defecto corre en modo DRY RUN (solo muestra qué se borraría).
 * Para eliminar de verdad: pasar --execute como argumento.
 *   npx tsx scripts/delete-products-no-images.ts --execute
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()
const SELLER_EMAIL = "vianferreteria@gmail.com"
const DRY_RUN = !process.argv.includes("--execute")

async function main() {
  console.log(`\n🔍 Buscando publicaciones sin imágenes de: ${SELLER_EMAIL}`)
  console.log(`   Modo: ${DRY_RUN ? "DRY RUN (solo lectura)" : "⚠️  EJECUTAR ELIMINACIÓN"}\n`)

  const seller = await prisma.user.findUnique({
    where: { email: SELLER_EMAIL },
    select: { id: true, name: true, email: true },
  })

  if (!seller) {
    console.error(`❌ No se encontró el usuario con email: ${SELLER_EMAIL}`)
    process.exit(1)
  }

  console.log(`✅ Vendedor encontrado: ${seller.name ?? "(sin nombre)"} (id: ${seller.id})\n`)

  const productsWithoutImages = await prisma.product.findMany({
    where: {
      sellerId: seller.id,
      images: { none: {} },
    },
    select: {
      id: true,
      title: true,
      price: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  })

  if (productsWithoutImages.length === 0) {
    console.log("✅ No hay publicaciones sin imágenes para este vendedor.")
    return
  }

  console.log(`📋 Publicaciones SIN imágenes (${productsWithoutImages.length} total):\n`)
  productsWithoutImages.forEach((p, i) => {
    console.log(
      `  ${i + 1}. [${p.id}] "${p.title}" — $${p.price} — ${p.isActive ? "activa" : "inactiva"} — ${p.createdAt.toLocaleDateString("es-AR")}`
    )
  })

  if (DRY_RUN) {
    console.log(`\n⚠️  DRY RUN: No se eliminó nada.`)
    console.log(`   Para eliminar, corré: npx tsx scripts/delete-products-no-images.ts --execute\n`)
    return
  }

  console.log(`\n🗑️  Eliminando ${productsWithoutImages.length} publicaciones...`)

  const ids = productsWithoutImages.map((p) => p.id)

  const deleted = await prisma.product.deleteMany({
    where: {
      id: { in: ids },
      sellerId: seller.id,
      images: { none: {} },
    },
  })

  console.log(`\n✅ Eliminadas: ${deleted.count} publicaciones.\n`)
}

main()
  .catch((e) => {
    console.error("❌ Error:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
