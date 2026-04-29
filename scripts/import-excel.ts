/**
 * Import products from MeLi Excel "PUBLICACIONES MAQJEEZ I.xlsx"
 * Connects directly to Supabase via Prisma.
 *
 * Usage: npx tsx scripts/import-excel.ts
 */
import * as XLSX from 'xlsx'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

// Use session-mode pooler (port 5432) which resolves to IPv4 and is Prisma-compatible
const POOLER_URL = `postgresql://postgres.doweovsukuskflgnxhhn:NXnPpq963f1oFIGI@aws-0-us-east-1.pooler.supabase.com:6543/postgres`

async function getPrisma() {
  const { Pool } = await import('pg')
  const { PrismaPg } = await import('@prisma/adapter-pg')
  const { PrismaClient } = await import('@prisma/client')
  const pool = new Pool({ connectionString: POOLER_URL })
  const adapter = new PrismaPg(pool)
  return { prisma: new PrismaClient({ adapter }), pool }
}

const EXCEL_PATH = path.join('C:\\Users\\Mi Pc\\Desktop\\BBBB', 'PUBLICACIONES MAQJEEZ I.xlsx')
const SKU_PREFIX = 'MAQJEEZ'

const COL = {
  ITEM_ID: 1,
  TITLE: 5,
  STOCK_WAREHOUSE: 7,
  STOCK_FULL: 8,
  PRICE: 9,
  WHOLESALE_1_PRICE: 13,
  CONDITION: 23,
  DESCRIPTION: 24,
  SHIPPING: 25,
  STATUS: 27,
  CATEGORY: 29,
}

function cleanNum(val: any): number {
  if (val === '' || val === '-' || val === null || val === undefined) return 0
  const s = String(val).replace(/[^0-9.,]/g, '').replace(',', '.')
  return parseFloat(s) || 0
}

function cleanStock(val: any): number {
  if (val === '' || val === '-' || val === null || val === undefined) return 0
  return parseInt(String(val).replace(/[^0-9]/g, '')) || 0
}

async function main() {
  console.log('🔌 Connecting to database...')
  console.log(`   URL: ${process.env.DATABASE_URL?.replace(/:[^@]+@/, ':****@')}`)
  const { prisma, pool } = await getPrisma()

  console.log('📖 Reading Excel file...')
  const wb = XLSX.readFile(EXCEL_PATH)
  const sheet = wb.Sheets['Publicaciones']
  if (!sheet) throw new Error('Sheet "Publicaciones" not found')

  const raw: any[][] = XLSX.utils.sheet_to_json(sheet, { defval: '', header: 1 })

  // Find header row
  let headerIdx = -1
  for (let i = 0; i < Math.min(raw.length, 10); i++) {
    const rowStr = raw[i].join(' ').toLowerCase()
    if (rowStr.includes('agrupador de variantes')) {
      headerIdx = i
      break
    }
  }
  if (headerIdx < 0) throw new Error('Header row not found')

  // Find first data row
  let dataStart = headerIdx + 1
  for (let i = headerIdx + 1; i < raw.length; i++) {
    const itemId = String(raw[i][COL.ITEM_ID] || '')
    if (itemId.startsWith('MLA') && cleanNum(raw[i][COL.PRICE]) > 0) {
      dataStart = i
      break
    }
  }

  const dataRows = raw.slice(dataStart).filter(r => {
    const itemId = String(r[COL.ITEM_ID] || '')
    return itemId.startsWith('MLA') && cleanNum(r[COL.PRICE]) > 0
  })

  console.log(`📦 Found ${dataRows.length} products in Excel`)

  // Get seller
  const seller = await prisma.user.findFirst({ where: { isSeller: true } })
  if (!seller) throw new Error('No seller found. Create a seller account first.')
  console.log(`👤 Seller: ${seller.name || seller.email} (${seller.id})`)

  // Get or create default category
  let defaultCategory = await prisma.category.findFirst({ where: { slug: 'general' } })
  if (!defaultCategory) {
    defaultCategory = await prisma.category.create({
      data: { name: 'General', slug: 'general', description: 'Categoría general' },
    })
  }

  // Category map
  const allCats = await prisma.category.findMany()
  const catMap = new Map<string, string>()
  allCats.forEach(c => catMap.set(c.name.toLowerCase(), c.id))

  // Existing products (avoid duplicates)
  const existing = await prisma.product.findMany({
    where: { sellerId: seller.id },
    select: { title: true, sku: true },
  })
  const existingTitles = new Set(existing.map(p => p.title.toLowerCase().trim()))

  // Find highest MAQJEEZ SKU number
  let skuCounter = 0
  existing.forEach(p => {
    if (p.sku) {
      const m = p.sku.match(/MAQJEEZ-(\d+)/)
      if (m) skuCounter = Math.max(skuCounter, parseInt(m[1]))
    }
  })
  skuCounter++

  let imported = 0
  let skipped = 0
  const errors: string[] = []

  for (const row of dataRows) {
    const title = String(row[COL.TITLE] || '').trim()
    if (!title) { skipped++; continue }

    const price = cleanNum(row[COL.PRICE])
    if (price <= 0) { skipped++; continue }

    if (existingTitles.has(title.toLowerCase())) {
      console.log(`  ⏭ Duplicate: "${title.substring(0, 50)}..."`)
      skipped++
      continue
    }

    const stockW = cleanStock(row[COL.STOCK_WAREHOUSE])
    const stockF = cleanStock(row[COL.STOCK_FULL])
    const stock = stockW + stockF

    const description = String(row[COL.DESCRIPTION] || '').trim()
    const condRaw = String(row[COL.CONDITION] || 'Nuevo').trim().toLowerCase()
    const condition = condRaw === 'usado' ? 'used' : condRaw === 'reacondicionado' ? 'refurbished' : 'new'

    const shipRaw = String(row[COL.SHIPPING] || '').toLowerCase()
    const freeShipping = shipRaw.includes('gratis')

    const statusRaw = String(row[COL.STATUS] || 'Activa').trim().toLowerCase()
    const isActive = statusRaw === 'activa'

    const categoryName = String(row[COL.CATEGORY] || '').trim()
    let categoryId = defaultCategory.id
    if (categoryName) {
      const catKey = categoryName.toLowerCase()
      if (catMap.has(catKey)) {
        categoryId = catMap.get(catKey)!
      } else {
        const slug = categoryName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').substring(0, 80)
        try {
          const newCat = await prisma.category.create({
            data: { name: categoryName, slug: slug || `cat-${Date.now()}`, description: categoryName },
          })
          catMap.set(catKey, newCat.id)
          categoryId = newCat.id
        } catch {
          // slug conflict — use default
        }
      }
    }

    const wholesalePrice = cleanNum(row[COL.WHOLESALE_1_PRICE])
    const originalPrice = wholesalePrice > price ? wholesalePrice : null

    const sku = `${SKU_PREFIX}-${String(skuCounter).padStart(6, '0')}`
    skuCounter++

    try {
      await prisma.product.create({
        data: {
          title,
          description: description || `${title} - Producto importado`,
          price,
          originalPrice,
          stock,
          sku,
          condition,
          isActive,
          isFeatured: false,
          isBoosted: false,
          views: 0,
          sales: 0,
          freeShipping,
          shippingCost: 0,
          qualityScore: Math.floor(Math.random() * 30) + 50,
          hasVideo: false,
          sellerId: seller.id,
          categoryId,
        },
      })
      existingTitles.add(title.toLowerCase())
      imported++
      if (imported % 10 === 0) console.log(`  ✅ ${imported}/${dataRows.length} imported...`)
    } catch (err: any) {
      errors.push(`"${title.substring(0, 40)}": ${err.message}`)
      console.error(`  ❌ ${title.substring(0, 40)}: ${err.message?.substring(0, 80)}`)
    }
  }

  console.log('\n═══════════════════════════════════')
  console.log(`✅ Imported: ${imported}`)
  console.log(`⏭ Skipped: ${skipped}`)
  console.log(`❌ Errors: ${errors.length}`)
  if (errors.length > 0) errors.forEach(e => console.log(`  - ${e}`))
  console.log('═══════════════════════════════════')

  await prisma.$disconnect()
  await pool.end()
  process.exit(0)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
