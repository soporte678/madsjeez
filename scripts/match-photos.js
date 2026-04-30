/**
 * Script: match-photos.js
 * 
 * 1. Fetches all products from Supabase (id, sku, title, existing images count)
 * 2. Scans photo bank folders
 * 3. Fuzzy-matches folder names → product titles
 * 4. Renames folders to include SKU prefix
 * 5. Uploads up to 10 images per product to Supabase Storage + inserts product_images rows
 * 
 * Usage: node scripts/match-photos.js [--dry-run] [--threshold 0.35]
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// ── Config ──
const SUPABASE_URL = "https://doweovsukuskflgnxhhn.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvd2VvdnN1a3Vza2ZsZ254aGhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMTkyNzEsImV4cCI6MjA5Mjc5NTI3MX0.a0H7VrFwHWZavy8L0DjUyoAecQAdEf22UsA-a0p0u4Y";
const PHOTO_BANK = "C:\\Users\\Mi Pc\\Desktop\\MERCADOLIBRE CUENTA NUEVA";
const STORAGE_BUCKET = "product-images";

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const REPORT_ONLY = args.includes("--report");
const thresholdIdx = args.indexOf("--threshold");
const MATCH_THRESHOLD = thresholdIdx >= 0 ? parseFloat(args[thresholdIdx + 1]) : 0.45;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Fuzzy matching ──
function normalize(str) {
  return str
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")  // strip accents
    .replace(/[^a-z0-9\s]/g, " ")                       // keep only alphanumeric
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(str) {
  return normalize(str).split(" ").filter(Boolean);
}

// Jaccard similarity on token sets
function similarity(a, b) {
  const tokensA = new Set(tokenize(a));
  const tokensB = new Set(tokenize(b));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;
  
  let intersection = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) intersection++;
  }
  const union = new Set([...tokensA, ...tokensB]).size;
  return intersection / union;
}

// Also check if all tokens of one string exist in the other (containment score)
function containment(folderName, productTitle) {
  const folderTokens = tokenize(folderName);
  const titleTokens = new Set(tokenize(productTitle));
  if (folderTokens.length === 0) return 0;
  
  let matches = 0;
  for (const t of folderTokens) {
    if (titleTokens.has(t)) matches++;
  }
  return matches / folderTokens.length;
}

function bestScore(folderName, productTitle) {
  const s = similarity(folderName, productTitle);
  const c = containment(folderName, productTitle);
  return Math.max(s, c * 0.9); // weight containment slightly lower
}

// ── Image helpers ──
const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"]);

function getImagesInFolder(folderPath) {
  try {
    const entries = fs.readdirSync(folderPath);
    return entries
      .filter(f => {
        const ext = path.extname(f).toLowerCase();
        return IMAGE_EXTS.has(ext) && fs.statSync(path.join(folderPath, f)).isFile();
      })
      .map(f => path.join(folderPath, f))
      .slice(0, 10); // max 10
  } catch {
    return [];
  }
}

function getLooseImagesForFolder(folderName) {
  // Look for loose image files in root that start with the folder name
  const rootFiles = fs.readdirSync(PHOTO_BANK);
  const normalizedFolder = normalize(folderName);
  
  return rootFiles
    .filter(f => {
      const ext = path.extname(f).toLowerCase();
      if (!IMAGE_EXTS.has(ext)) return false;
      const stat = fs.statSync(path.join(PHOTO_BANK, f));
      if (!stat.isFile()) return false;
      
      // Check if filename starts with or contains the folder name
      const normalizedFile = normalize(path.parse(f).name);
      return normalizedFile.startsWith(normalizedFolder) || 
             normalizedFolder.startsWith(normalizedFile);
    })
    .map(f => path.join(PHOTO_BANK, f))
    .slice(0, 10);
}

// ── Main ──
async function main() {
  console.log("🔍 Fetching products from Supabase...");
  
  // Fetch all products
  let allProducts = [];
  let page = 0;
  const PAGE_SIZE = 1000;
  while (true) {
    const { data, error } = await supabase
      .from("products")
      .select("id, sku, title, product_images(id)")
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    
    if (error) { console.error("DB Error:", error.message); return; }
    if (!data || data.length === 0) break;
    allProducts = allProducts.concat(data);
    if (data.length < PAGE_SIZE) break;
    page++;
  }
  
  console.log(`  📦 ${allProducts.length} products found in database`);
  
  // Get folders from photo bank
  const entries = fs.readdirSync(PHOTO_BANK);
  const folders = entries.filter(e => {
    try { return fs.statSync(path.join(PHOTO_BANK, e)).isDirectory(); }
    catch { return false; }
  });
  
  console.log(`  📂 ${folders.length} folders found in photo bank`);
  console.log(`  🎯 Match threshold: ${MATCH_THRESHOLD}`);
  console.log(`  ${DRY_RUN ? "🧪 DRY RUN MODE - no changes will be made" : "⚡ LIVE MODE - will rename folders and upload images"}\n`);

  const matches = [];
  const noMatch = [];

  for (const folder of folders) {
    let bestProduct = null;
    let bestScoreVal = 0;

    for (const product of allProducts) {
      const score = bestScore(folder, product.title);
      if (score > bestScoreVal) {
        bestScoreVal = score;
        bestProduct = product;
      }
    }

    if (bestScoreVal >= MATCH_THRESHOLD && bestProduct) {
      const folderPath = path.join(PHOTO_BANK, folder);
      let images = getImagesInFolder(folderPath);
      
      // If folder is empty, try to find loose images in root with similar name
      if (images.length === 0) {
        images = getLooseImagesForFolder(folder);
      }
      
      const existingImageCount = bestProduct.product_images?.length || 0;
      const slotsAvailable = Math.max(0, 10 - existingImageCount);
      const imagesToUpload = images.slice(0, slotsAvailable);

      matches.push({
        folder,
        folderPath,
        product: bestProduct,
        score: bestScoreVal,
        imagesFound: images.length,
        imagesToUpload: imagesToUpload.length,
        existingImages: existingImageCount,
        images: imagesToUpload,
      });
    } else {
      noMatch.push({ folder, bestScore: bestScoreVal, bestTitle: bestProduct?.title || "N/A" });
    }
  }

  // Sort matches by score descending
  matches.sort((a, b) => b.score - a.score);

  // ── REPORT MODE: just write CSV ──
  if (REPORT_ONLY) {
    const lines = ["SCORE,FOLDER,PRODUCT_TITLE,SKU,IMAGES_FOUND,EXISTING,TO_UPLOAD"];
    for (const m of matches) {
      lines.push(`${(m.score*100).toFixed(0)}%,"${m.folder}","${m.product.title}",${m.product.sku||"NO-SKU"},${m.imagesFound},${m.existingImages},${m.imagesToUpload}`);
    }
    lines.push("");
    lines.push("--- UNMATCHED ---");
    for (const nm of noMatch) {
      lines.push(`${(nm.bestScore*100).toFixed(0)}%,"${nm.folder}","${nm.bestTitle}",--,--,--,--`);
    }
    lines.push("");
    lines.push(`TOTAL: ${matches.length} matched, ${noMatch.length} unmatched out of ${folders.length} folders`);
    fs.writeFileSync(path.join(__dirname, "match-report.csv"), lines.join("\n"), "utf8");
    console.log(`Report written to scripts/match-report.csv (${matches.length} matches, ${noMatch.length} unmatched)`);
    return;
  }

  // ── Report ──
  console.log("================================================");
  console.log("  MATCHES FOUND: " + matches.length);
  console.log("================================================\n");

  for (const m of matches) {
    const sku = m.product.sku || "NO-SKU";
    console.log(`✅ [${(m.score * 100).toFixed(0)}%] "${m.folder}"`);
    console.log(`   → Product: "${m.product.title}" (SKU: ${sku})`);
    console.log(`   → Images: ${m.imagesFound} found, ${m.existingImages} existing, ${m.imagesToUpload} to upload`);
    
    if (!DRY_RUN && sku !== "NO-SKU") {
      // Rename folder to include SKU
      const newFolderName = `${sku} - ${m.folder}`;
      const newFolderPath = path.join(PHOTO_BANK, newFolderName);
      
      if (!fs.existsSync(newFolderPath) && m.folderPath !== newFolderPath) {
        try {
          fs.renameSync(m.folderPath, newFolderPath);
          console.log(`   📁 Renamed → "${newFolderName}"`);
          // Update image paths after rename
          m.images = m.images.map(img => img.replace(m.folderPath, newFolderPath));
        } catch (e) {
          console.log(`   ⚠️  Rename failed: ${e.message}`);
        }
      }
    }
    
    // Upload images
    if (!DRY_RUN && m.images.length > 0) {
      for (let i = 0; i < m.images.length; i++) {
        const imgPath = m.images[i];
        const ext = path.extname(imgPath).toLowerCase();
        const fileName = `${m.product.id}/${Date.now()}_${i}${ext}`;
        
        try {
          const fileBuffer = fs.readFileSync(imgPath);
          const contentType = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(fileName, fileBuffer, { contentType, upsert: false });
          
          if (uploadError) {
            console.log(`   ⚠️  Upload failed (${path.basename(imgPath)}): ${uploadError.message}`);
            continue;
          }
          
          // Get public URL
          const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);
          const publicUrl = urlData.publicUrl;
          
          // Insert product_image row
          const isPrimary = m.existingImages === 0 && i === 0;
          const { error: insertError } = await supabase
            .from("product_images")
            .insert({
              product_id: m.product.id,
              url: publicUrl,
              is_primary: isPrimary,
              sort_order: m.existingImages + i,
            });
          
          if (insertError) {
            console.log(`   ⚠️  DB insert failed: ${insertError.message}`);
          } else {
            console.log(`   📸 Uploaded: ${path.basename(imgPath)}${isPrimary ? " (PRIMARY)" : ""}`);
          }
        } catch (e) {
          console.log(`   ⚠️  Error: ${e.message}`);
        }
      }
    }
    console.log();
  }

  // No matches
  if (noMatch.length > 0) {
    console.log("\n═══════════════════════════════════════════════");
    console.log("  NO MATCH: " + noMatch.length + " folders");
    console.log("═══════════════════════════════════════════════\n");
    
    for (const nm of noMatch.slice(0, 30)) {
      console.log(`❌ [${(nm.bestScore * 100).toFixed(0)}%] "${nm.folder}" → closest: "${nm.bestTitle}"`);
    }
    if (noMatch.length > 30) {
      console.log(`   ... and ${noMatch.length - 30} more`);
    }
  }

  console.log(`\n📊 Summary: ${matches.length} matched, ${noMatch.length} unmatched out of ${folders.length} folders`);
}

main().catch(console.error);
