const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const EXCEL_PATH = path.join('C:\\Users\\Mi Pc\\Desktop\\BBBB', 'PUBLICACIONES MAQJEEZ I.xlsx');
const OUTPUT_PATH = path.join('C:\\Users\\Mi Pc\\Desktop\\BBBB', 'import-products.sql');
const SKU_PREFIX = 'MAQJEEZ';

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
};

function cleanNum(val) {
  if (val === '' || val === '-' || val === null || val === undefined) return 0;
  const s = String(val).replace(/[^0-9.,]/g, '').replace(',', '.');
  return parseFloat(s) || 0;
}

function cleanStock(val) {
  if (val === '' || val === '-' || val === null || val === undefined) return 0;
  return parseInt(String(val).replace(/[^0-9]/g, '')) || 0;
}

function escapeSQL(str) {
  if (!str) return '';
  return str.replace(/'/g, "''").replace(/\\/g, '\\\\');
}

function generateSlug(name) {
  return name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 80);
}

console.log('📖 Reading Excel file...');
const wb = XLSX.readFile(EXCEL_PATH);
const sheet = wb.Sheets['Publicaciones'];
const raw = XLSX.utils.sheet_to_json(sheet, { defval: '', header: 1 });

// Find header row
let headerIdx = -1;
for (let i = 0; i < Math.min(raw.length, 10); i++) {
  const rowStr = raw[i].join(' ').toLowerCase();
  if (rowStr.includes('agrupador de variantes')) {
    headerIdx = i;
    break;
  }
}

// Find first data row
let dataStart = headerIdx + 1;
for (let i = headerIdx + 1; i < raw.length; i++) {
  const itemId = String(raw[i][COL.ITEM_ID] || '');
  if (itemId.startsWith('MLA') && cleanNum(raw[i][COL.PRICE]) > 0) {
    dataStart = i;
    break;
  }
}

const dataRows = raw.slice(dataStart).filter(r => {
  const itemId = String(r[COL.ITEM_ID] || '');
  return itemId.startsWith('MLA') && cleanNum(r[COL.PRICE]) > 0;
});

console.log(`📦 Found ${dataRows.length} products`);

// Collect unique categories
const categories = new Set();
dataRows.forEach(row => {
  const cat = String(row[COL.CATEGORY] || '').trim();
  if (cat) categories.add(cat);
});

// Build SQL
let sql = '';

// Header
sql += '-- ============================================\n';
sql += '-- MAQJEEZ Product Import from MeLi Excel\n';
sql += `-- Generated: ${new Date().toISOString()}\n`;
sql += `-- Total products: ${dataRows.length}\n`;
sql += '-- ============================================\n\n';

// Step 0: Instructions
sql += '-- IMPORTANT: Before running this SQL, you need to know:\n';
sql += '-- 1. Your seller user ID (run: SELECT id, name, email FROM users WHERE is_seller = true LIMIT 5;)\n';
sql += '-- 2. Replace SELLER_ID_HERE below with your actual seller ID\n\n';

// Step 1: Create categories
sql += '-- ============================================\n';
sql += '-- STEP 1: Create categories (if they don\'t exist)\n';
sql += '-- ============================================\n\n';

categories.forEach(cat => {
  const slug = generateSlug(cat);
  sql += `INSERT INTO categories (id, name, slug, description, created_at)\n`;
  sql += `SELECT gen_random_uuid(), '${escapeSQL(cat)}', '${escapeSQL(slug)}', '${escapeSQL(cat)}', NOW()\n`;
  sql += `WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = '${escapeSQL(slug)}');\n\n`;
});

// Also ensure a General category exists
sql += `INSERT INTO categories (id, name, slug, description, created_at)\n`;
sql += `SELECT gen_random_uuid(), 'General', 'general', 'Categoría general', NOW()\n`;
sql += `WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'general');\n\n`;

// Step 2: Create a function to get the seller_id
sql += '-- ============================================\n';
sql += '-- STEP 2: Set the seller ID\n';
sql += '-- Run this query first to find your seller ID:\n';
sql += '-- SELECT id, name, email FROM users WHERE is_seller = true;\n';
sql += '-- Then replace the value below:\n';
sql += '-- ============================================\n\n';

sql += `DO $$\n`;
sql += `DECLARE\n`;
sql += `  v_seller_id TEXT;\n`;
sql += `  v_cat_id TEXT;\n`;
sql += `BEGIN\n`;
sql += `  -- Get the first seller (isSeller has no @map so it's camelCase in DB)\n`;
sql += `  SELECT id INTO v_seller_id FROM users WHERE "isSeller" = true LIMIT 1;\n`;
sql += `  \n`;
sql += `  IF v_seller_id IS NULL THEN\n`;
sql += `    RAISE EXCEPTION 'No seller found! Create a seller account first.';\n`;
sql += `  END IF;\n`;
sql += `  \n`;
sql += `  RAISE NOTICE 'Using seller ID: %', v_seller_id;\n\n`;

// Step 3: Insert products
let skuCounter = 1;
const seenTitles = new Set();

dataRows.forEach(row => {
  const title = String(row[COL.TITLE] || '').trim();
  if (!title) return;

  const price = cleanNum(row[COL.PRICE]);
  if (price <= 0) return;

  // Skip duplicate titles in the same batch
  const titleKey = title.toLowerCase();
  if (seenTitles.has(titleKey)) return;
  seenTitles.add(titleKey);

  const stockW = cleanStock(row[COL.STOCK_WAREHOUSE]);
  const stockF = cleanStock(row[COL.STOCK_FULL]);
  const stock = stockW + stockF;

  const description = String(row[COL.DESCRIPTION] || '').trim();
  const condRaw = String(row[COL.CONDITION] || 'Nuevo').trim().toLowerCase();
  const condition = condRaw === 'usado' ? 'used' : condRaw === 'reacondicionado' ? 'refurbished' : 'new';

  const shipRaw = String(row[COL.SHIPPING] || '').toLowerCase();
  const freeShipping = shipRaw.includes('gratis');

  const statusRaw = String(row[COL.STATUS] || 'Activa').trim().toLowerCase();
  const isActive = statusRaw === 'activa';

  const categoryName = String(row[COL.CATEGORY] || '').trim();
  const categorySlug = categoryName ? generateSlug(categoryName) : 'general';

  const wholesalePrice = cleanNum(row[COL.WHOLESALE_1_PRICE]);
  const originalPrice = wholesalePrice > price ? wholesalePrice : null;

  const sku = `${SKU_PREFIX}-${String(skuCounter).padStart(6, '0')}`;
  skuCounter++;

  const qualityScore = Math.floor(Math.random() * 30) + 50;
  const escapedTitle = escapeSQL(title);
  const escapedDesc = escapeSQL(description || `${title} - Producto importado`);

  sql += `  -- ${sku}: ${title.substring(0, 60)}\n`;
  sql += `  SELECT id INTO v_cat_id FROM categories WHERE slug = '${escapeSQL(categorySlug)}' LIMIT 1;\n`;
  sql += `  IF v_cat_id IS NULL THEN\n`;
  sql += `    SELECT id INTO v_cat_id FROM categories WHERE slug = 'general' LIMIT 1;\n`;
  sql += `  END IF;\n`;
  sql += `  \n`;
  sql += `  INSERT INTO products (\n`;
  sql += `    id, title, description, price, compare_price, stock, sku, condition,\n`;
  sql += `    is_active, is_featured, is_boosted, views, sales,\n`;
  sql += `    original_price, free_shipping, shipping_cost, quality_score, has_video,\n`;
  sql += `    seller_id, category_id, created_at, updated_at\n`;
  sql += `  ) SELECT\n`;
  sql += `    gen_random_uuid(),\n`;
  sql += `    '${escapedTitle}',\n`;
  sql += `    '${escapedDesc}',\n`;
  sql += `    ${price},\n`;
  sql += `    ${originalPrice !== null ? originalPrice : 'NULL'},\n`;
  sql += `    ${stock},\n`;
  sql += `    '${sku}',\n`;
  sql += `    '${condition}',\n`;
  sql += `    ${isActive},\n`;
  sql += `    false,\n`;
  sql += `    false,\n`;
  sql += `    0,\n`;
  sql += `    0,\n`;
  sql += `    ${originalPrice !== null ? originalPrice : 'NULL'},\n`;
  sql += `    ${freeShipping},\n`;
  sql += `    0,\n`;
  sql += `    ${qualityScore},\n`;
  sql += `    false,\n`;
  sql += `    v_seller_id,\n`;
  sql += `    v_cat_id,\n`;
  sql += `    NOW(),\n`;
  sql += `    NOW()\n`;
  sql += `  WHERE NOT EXISTS (\n`;
  sql += `    SELECT 1 FROM products WHERE title = '${escapedTitle}' AND seller_id = v_seller_id\n`;
  sql += `  );\n\n`;

  // Note: Product columns that have @map in schema:
  // comparePrice -> compare_price, isActive -> is_active, isFeatured -> is_featured, 
  // isBoosted -> is_boosted, originalPrice -> original_price, freeShipping -> free_shipping,
  // shippingCost -> shipping_cost, qualityScore -> quality_score, hasVideo -> has_video,
  // sellerId -> seller_id, categoryId -> category_id, createdAt -> created_at, updatedAt -> updated_at
  // These are all correct above (using the @map snake_case names)
});

sql += `  RAISE NOTICE 'Import complete! Products inserted for seller %', v_seller_id;\n`;
sql += `END $$;\n`;

// Write to file
fs.writeFileSync(OUTPUT_PATH, sql, 'utf8');
console.log(`\n✅ SQL file generated: ${OUTPUT_PATH}`);
console.log(`   Total unique products: ${seenTitles.size}`);
console.log(`   SKUs: MAQJEEZ-000001 to MAQJEEZ-${String(seenTitles.size).padStart(6, '0')}`);
console.log(`\n📋 Next steps:`);
console.log(`   1. Go to Supabase Dashboard → SQL Editor`);
console.log(`   2. Open or paste the file: ${OUTPUT_PATH}`);
console.log(`   3. Click "Run" to execute`);
