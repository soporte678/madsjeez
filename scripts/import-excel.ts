/**
 * Import products from MeLi Excel "PUBLICACIONES MAQJEEZ I.xlsx"
 * Reads the Excel, extracts product data, and sends it to the API.
 *
 * Usage: npx tsx scripts/import-excel.ts <BASE_URL> <SESSION_COOKIE>
 * Example: npx tsx scripts/import-excel.ts https://madsjeez.up.railway.app "next-auth.session-token=abc123"
 *
 * NOTE: Get the session cookie from your browser's DevTools → Application → Cookies
 */
import * as XLSX from 'xlsx'
import path from 'path'

const EXCEL_PATH = path.join('C:\\Users\\Mi Pc\\Desktop\\BBBB', 'PUBLICACIONES MAQJEEZ I.xlsx')

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
  const baseUrl = process.argv[2]
  const sessionCookie = process.argv[3]

  if (!baseUrl || !sessionCookie) {
    console.error('Usage: npx tsx scripts/import-excel.ts <BASE_URL> <SESSION_COOKIE>')
    console.error('Example: npx tsx scripts/import-excel.ts https://madsjeez.up.railway.app "next-auth.session-token=abc123"')
    process.exit(1)
  }

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

  // Convert to API format
  const products = dataRows.map(row => {
    const title = String(row[COL.TITLE] || '').trim()
    const price = cleanNum(row[COL.PRICE])
    const stockWarehouse = cleanStock(row[COL.STOCK_WAREHOUSE])
    const stockFull = cleanStock(row[COL.STOCK_FULL])
    const stock = stockWarehouse + stockFull
    const description = String(row[COL.DESCRIPTION] || '').trim()
    const conditionRaw = String(row[COL.CONDITION] || 'Nuevo').trim().toLowerCase()
    const condition = conditionRaw === 'usado' ? 'used' : conditionRaw === 'reacondicionado' ? 'refurbished' : 'new'
    const shippingRaw = String(row[COL.SHIPPING] || '').toLowerCase()
    const freeShipping = shippingRaw.includes('gratis')
    const statusRaw = String(row[COL.STATUS] || 'Activa').trim().toLowerCase()
    const isActive = statusRaw === 'activa'
    const category = String(row[COL.CATEGORY] || '').trim()
    const wholesalePrice = cleanNum(row[COL.WHOLESALE_1_PRICE])
    const originalPrice = wholesalePrice > price ? wholesalePrice : null

    return { title, description, price, originalPrice, stock, condition, freeShipping, isActive, category }
  }).filter(p => p.title && p.price > 0)

  console.log(`📤 Sending ${products.length} products to ${baseUrl}/api/import-products ...`)

  // Send in batches of 50 to avoid timeouts
  const BATCH_SIZE = 50
  let totalImported = 0
  let totalSkipped = 0
  let totalErrors = 0

  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE)
    console.log(`  📦 Batch ${Math.floor(i / BATCH_SIZE) + 1}: sending ${batch.length} products...`)

    try {
      const res = await fetch(`${baseUrl}/api/import-products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': sessionCookie,
        },
        body: JSON.stringify({ products: batch }),
      })

      const result = await res.json()

      if (!res.ok) {
        console.error(`  ❌ Batch failed: ${result.error}`)
        totalErrors += batch.length
        continue
      }

      totalImported += result.imported || 0
      totalSkipped += result.skipped || 0
      totalErrors += result.errors || 0
      console.log(`  ✅ Imported: ${result.imported}, Skipped: ${result.skipped}, Errors: ${result.errors}`)
      if (result.errorDetails?.length > 0) {
        result.errorDetails.forEach((e: string) => console.log(`     ⚠ ${e}`))
      }
    } catch (err: any) {
      console.error(`  ❌ Network error: ${err.message}`)
      totalErrors += batch.length
    }
  }

  console.log('\n═══════════════════════════════════')
  console.log(`✅ Total imported: ${totalImported}`)
  console.log(`⏭ Total skipped: ${totalSkipped}`)
  console.log(`❌ Total errors: ${totalErrors}`)
  console.log('═══════════════════════════════════')
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
