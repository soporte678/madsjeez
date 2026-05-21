/**
 * Descarga imágenes de un producto de AliExpress a photo-bank/.
 *
 * AliExpress renderiza con JavaScript y suele mostrar captcha si detecta bot;
 * por eso usa Playwright (navegador real). La primera vez: npx playwright install chromium
 *
 * Uso:
 *   npx tsx scripts/scrape-aliexpress-images.ts "https://www.aliexpress.com/item/1234567890.html"
 *   npx tsx scripts/scrape-aliexpress-images.ts --url "..." --folder "SKU123 - titulo producto"
 *   npx tsx scripts/scrape-aliexpress-images.ts --url "..." --headed   # ventana visible (captcha manual)
 *   npx tsx scripts/scrape-aliexpress-images.ts --urls urls.txt
 *
 * Después: node scripts/match-photos.js  (sube a Supabase si el nombre de carpeta matchea el título)
 */

import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const PHOTO_BANK =
  process.env.PHOTO_BANK_PATH || path.join(process.cwd(), "photo-bank");

const IMAGE_EXT = /\.(jpe?g|png|webp|gif)(\?|$)/i;
const ALICDN = /alicdn\.com/i;

type CliOptions = {
  urls: string[];
  folder?: string;
  headed: boolean;
  maxImages: number;
  dryRun: boolean;
};

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {
    urls: [],
    headed: false,
    maxImages: 10,
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--headed") opts.headed = true;
    else if (arg === "--dry-run") opts.dryRun = true;
    else if (arg === "--folder") opts.folder = argv[++i];
    else if (arg === "--max") opts.maxImages = Math.max(1, parseInt(argv[++i], 10) || 10);
    else if (arg === "--url") opts.urls.push(argv[++i]);
    else if (arg === "--urls") {
      const file = argv[++i];
      const lines = fs
        .readFileSync(file, "utf8")
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith("#"));
      opts.urls.push(...lines);
    } else if (arg.startsWith("http")) {
      opts.urls.push(arg);
    }
  }

  return opts;
}

function extractItemId(url: string): string | null {
  const m =
    url.match(/\/item\/(\d+)\.html/i) ||
    url.match(/[?&]productId=(\d+)/i) ||
    url.match(/\/(\d{10,})\.html/i);
  return m ? m[1] : null;
}

function normalizeAliexpressImageUrl(raw: string): string {
  let url = raw.replace(/\\u002F/g, "/").replace(/\\/g, "");
  if (url.startsWith("//")) url = `https:${url}`;
  // Quitar thumbs pequeños; pedir versión más grande cuando el patrón lo permite
  url = url
    .replace(/_\d+x\d+\.(jpg|jpeg|png|webp)/i, ".$1")
    .replace(/\.(jpg|jpeg|png|webp)_\d+x\d+\./i, ".$1.");
  return url.split("?")[0];
}

function isProductImageUrl(url: string): boolean {
  if (!ALICDN.test(url)) return false;
  if (!IMAGE_EXT.test(url)) return false;
  const lower = url.toLowerCase();
  if (lower.includes("sprite") || lower.includes("icon")) return false;
  if (lower.includes("logo")) return false;
  return true;
}

function dedupeUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const u of urls) {
    const n = normalizeAliexpressImageUrl(u);
    const key = n.replace(/_\d+x\d+/g, "").toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(n);
  }
  return out;
}

async function extractImageUrlsFromPage(
  page: import("playwright").Page
): Promise<string[]> {
  const raw = await page.evaluate(() => {
    const found: string[] = [];

    const add = (src: string | null | undefined) => {
      if (src && typeof src === "string") found.push(src);
    };

    document.querySelectorAll("img").forEach((img) => {
      add(img.getAttribute("src"));
      add(img.getAttribute("data-src"));
      add(img.getAttribute("data-zoom-src"));
    });

    document.querySelectorAll("[style*='background-image']").forEach((el) => {
      const style = el.getAttribute("style") || "";
      const m = style.match(/url\(['"]?(.*?)['"]?\)/i);
      if (m) add(m[1]);
    });

    document.querySelectorAll("script").forEach((script) => {
      const text = script.textContent || "";
      if (!text.includes("alicdn") && !text.includes("imagePath")) return;
      const re =
        /https?:\\?\/\\?\/[^"'\s]+alicdn[^"'\s]+\.(?:jpg|jpeg|png|webp)/gi;
      let match: RegExpExecArray | null;
      while ((match = re.exec(text)) !== null) {
        found.push(match[0].replace(/\\\//g, "/"));
      }
    });

    return found;
  });

  return dedupeUrls(raw.filter(isProductImageUrl));
}

async function downloadImage(
  url: string,
  destPath: string
): Promise<void> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      Referer: "https://www.aliexpress.com/",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} al descargar ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 8_000) throw new Error(`Imagen demasiado chica (${buf.length} bytes)`);
  fs.writeFileSync(destPath, buf);
}

async function scrapeOne(
  productUrl: string,
  opts: CliOptions
): Promise<{ folder: string; count: number }> {
  const { chromium } = await import("playwright");

  const itemId = extractItemId(productUrl);
  if (!itemId) {
    throw new Error(`No se pudo obtener el ID del producto desde: ${productUrl}`);
  }

  const folderName = opts.folder || `aliexpress-${itemId}`;
  const outDir = path.join(PHOTO_BANK, folderName);

  console.log(`\n→ ${productUrl}`);
  console.log(`  Carpeta: ${outDir}`);

  const browser = await chromium.launch({
    headless: !opts.headed,
    args: ["--disable-blink-features=AutomationControlled"],
  });

  try {
    const context = await browser.newContext({
      locale: "es-AR",
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      viewport: { width: 1280, height: 900 },
    });

    const page = await context.newPage();
    await page.goto(productUrl, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });

    if (opts.headed) {
      console.log(
        "  Si aparece captcha o login, resolvelo en el navegador. Esperando 15s..."
      );
      await page.waitForTimeout(15_000);
    } else {
      await page.waitForTimeout(4_000);
    }

    // Scroll suave para cargar lazy images
    await page.evaluate(async () => {
      for (let y = 0; y < 1200; y += 200) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 150));
      }
    });

    let imageUrls = await extractImageUrlsFromPage(page);

    if (imageUrls.length === 0) {
      const title = await page.title();
      throw new Error(
        `No se encontraron imágenes (¿captcha o página bloqueada?). Título: "${title}". Probá con --headed`
      );
    }

    imageUrls = imageUrls.slice(0, opts.maxImages);
    console.log(`  ${imageUrls.length} URL(s) de imagen`);

    if (opts.dryRun) {
      imageUrls.forEach((u, i) => console.log(`    [${i + 1}] ${u}`));
      return { folder: folderName, count: imageUrls.length };
    }

    fs.mkdirSync(outDir, { recursive: true });

    let saved = 0;
    for (let i = 0; i < imageUrls.length; i++) {
      const ext = path.extname(new URL(imageUrls[i]).pathname) || ".jpg";
      const safeExt = IMAGE_EXT.test(ext) ? ext : ".jpg";
      const fileName = `${String(i + 1).padStart(2, "0")}${safeExt}`;
      const dest = path.join(outDir, fileName);
      try {
        await downloadImage(imageUrls[i], dest);
        saved++;
        console.log(`  ✓ ${fileName}`);
      } catch (e) {
        console.warn(
          `  ✗ ${fileName}: ${e instanceof Error ? e.message : String(e)}`
        );
      }
    }

    if (saved === 0) throw new Error("No se pudo guardar ninguna imagen");
    return { folder: folderName, count: saved };
  } finally {
    await browser.close();
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.urls.length === 0) {
    console.error(`
Uso:
  npx tsx scripts/scrape-aliexpress-images.ts <url-aliexpress>
  npx tsx scripts/scrape-aliexpress-images.ts --url <url> [--folder "SKU - nombre"]
  npx tsx scripts/scrape-aliexpress-images.ts --urls lista.txt [--headed]

Opciones:
  --headed     Abre Chromium visible (útil si pide captcha)
  --folder     Nombre de subcarpeta en photo-bank (default: aliexpress-<id>)
  --max N      Máximo de imágenes (default: 10)
  --dry-run    Solo lista URLs, no descarga

Primera vez: npx playwright install chromium
`);
    process.exit(1);
  }

  if (!opts.dryRun) fs.mkdirSync(PHOTO_BANK, { recursive: true });

  let ok = 0;
  let fail = 0;

  for (const url of opts.urls) {
    try {
      const result = await scrapeOne(url, opts);
      ok++;
      console.log(`  Listo: ${result.count} imagen(es) en ${result.folder}`);
    } catch (e) {
      fail++;
      console.error(
        `  Error: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  console.log(`\nResumen: ${ok} OK, ${fail} error(es). Photo bank: ${PHOTO_BANK}`);
  if (ok > 0 && !opts.dryRun) {
    console.log(
      "Siguiente paso: node scripts/match-photos.js --dry-run  (revisar matches) y luego sin --dry-run"
    );
  }

  process.exit(fail > 0 ? 1 : 0);
}

main();
