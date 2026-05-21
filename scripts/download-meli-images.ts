/**
 * Descarga imágenes de una publicación de Mercado Libre a photo-bank/.
 *
 * Uso:
 *   npx tsx scripts/download-meli-images.ts "https://articulo.mercadolibre.com.ar/MLA-1234567890-..."
 *   npx tsx scripts/download-meli-images.ts --url "..." --folder "MAQJEEZ-001 - titulo"
 *   npx tsx scripts/download-meli-images.ts MLA1234567890
 *   npx tsx scripts/download-meli-images.ts --urls links.txt
 *
 * Token (recomendado si la API devuelve 403):
 *   En .env.local: MELI_ACCESS_TOKEN=APP_USR-...
 *   O conectá MeLi en el panel y copiá el access token temporal, o: --token APP_USR-...
 *
 * Solo usá fotos de publicaciones propias o con permiso del titular.
 */

import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const PHOTO_BANK =
  process.env.PHOTO_BANK_PATH || path.join(process.cwd(), "photo-bank");

const ITEM_ID_RE = /(MLA|MLB|MLM|MLC|MLU|MPE|MCO|MEC)\d+/i;

type MeliPicture = { secure_url?: string; url?: string; max_size?: string };
type MeliItem = {
  id?: string;
  title?: string;
  pictures?: MeliPicture[];
  status?: string;
};

export type CliOptions = {
  inputs: string[];
  folder?: string;
  token?: string;
  maxImages: number;
  dryRun: boolean;
};

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {
    inputs: [],
    maxImages: 12,
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dry-run") opts.dryRun = true;
    else if (arg === "--folder") opts.folder = argv[++i];
    else if (arg === "--max") opts.maxImages = Math.max(1, parseInt(argv[++i], 10) || 12);
    else if (arg === "--token") opts.token = argv[++i];
    else if (arg === "--url") opts.inputs.push(argv[++i]);
    else if (arg === "--urls") {
      const file = argv[++i];
      const lines = fs
        .readFileSync(file, "utf8")
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith("#"));
      opts.inputs.push(...lines);
    } else if (arg.startsWith("http") || ITEM_ID_RE.test(arg)) {
      opts.inputs.push(arg);
    }
  }

  opts.token =
    opts.token ||
    process.env.MELI_ACCESS_TOKEN ||
    process.env.MERCADOLIBRE_ACCESS_TOKEN ||
    undefined;

  return opts;
}

function extractItemId(input: string): string | null {
  const trimmed = input.trim();
  const direct = trimmed.match(ITEM_ID_RE);
  if (direct && !trimmed.startsWith("http")) return direct[0].toUpperCase();

  try {
    const u = new URL(trimmed);

    // Links /p/MLA... suelen ser catálogo; la publicación real viene en wid o pdp_filters
    const wid = u.searchParams.get("wid");
    if (wid && ITEM_ID_RE.test(wid)) return wid.match(ITEM_ID_RE)![0].toUpperCase();

    const pdp = u.searchParams.get("pdp_filters") || "";
    const fromPdp = pdp.match(/item_id[:\s%3D]+(MLA\d+)/i);
    if (fromPdp) return fromPdp[1].toUpperCase();

    const q = u.searchParams.get("item_id") || u.searchParams.get("itemId");
    if (q && ITEM_ID_RE.test(q)) return q.match(ITEM_ID_RE)![0].toUpperCase();

    const fromPath = u.pathname.match(ITEM_ID_RE);
    if (fromPath) return fromPath[0].toUpperCase();
  } catch {
    /* not a URL */
  }

  if (direct) return direct[0].toUpperCase();
  return null;
}

function normalizeMeliImageUrl(raw: string): string {
  let url = raw.replace(/\\u002F/g, "/");
  if (url.startsWith("//")) url = `https:${url}`;
  return url.split("?")[0];
}

/** Filtra fotos de galería del producto (excluye íconos, UI, thumbs -OO). */
function filterGalleryUrls(urls: string[]): string[] {
  const clean = urls
    .map(normalizeMeliImageUrl)
    .filter(
      (u) =>
        u.startsWith("http") &&
        u.includes("mlstatic.com") &&
        /D_NQ_/.test(u) &&
        !u.includes("data:image")
    )
    .filter((u) => !/\/ui\//.test(u) && !/-OO\./i.test(u));

  const np = clean.filter((u) => /D_NQ_NP/.test(u));
  const pool = np.length ? np : clean;

  const upgraded = pool.map((u) => {
    if (/NP_2X_.*-F\./i.test(u)) return u;
    let x = u.replace(/-O\.(webp|jpe?g|png)/i, "-F.$1");
    x = x.replace(/(D_NQ_NP)_(\d)/i, "$1_2X_$2");
    return x;
  });

  const seen = new Set<string>();
  const out: string[] = [];
  for (const u of upgraded) {
    const key = u.match(/MLA\d+/i)?.[0] || u;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(u);
  }
  return out;
}

function itemIdToArticuloUrl(itemId: string): string {
  const slug = itemId.replace(/^(MLA|MLB|MLM)(\d+)$/i, "$1-$2");
  return `https://articulo.mercadolibre.com.ar/${slug}`;
}

/** Solo nombre del producto: sin precio, envío gratis, MLA en el título, etc. */
function cleanMeliProductTitle(raw: string): string {
  let t = raw
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

  // Cortar antes del precio ($ …) o separadores típicos de MeLi
  t = t.split(/\s*[-|–]\s*\$\s*/)[0] ?? t;
  t = t.split(/\s+\$\s*/)[0] ?? t;

  const cutSuffix =
    /\s*[|–-]\s*(Envío\s+gratis|Envio\s+gratis|Cuotas\s+sin\s+interés|Llega\s+gratis|Compra\s+protegida).*$/i;
  t = t.replace(cutSuffix, "").trim();

  t = t.replace(/^\[(MLA|MLB|MLM)\d+\]\s*/i, "").trim();
  return t;
}

function titleFromJsonLd(html: string): string | undefined {
  const ldBlocks = html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );
  for (const block of ldBlocks) {
    try {
      const data = JSON.parse(block[1]) as unknown;
      const list = Array.isArray(data) ? data : [data];
      for (const item of list) {
        if (
          item &&
          typeof item === "object" &&
          (item as { "@type"?: string })["@type"] === "Product" &&
          typeof (item as { name?: string }).name === "string"
        ) {
          return cleanMeliProductTitle((item as { name: string }).name);
        }
      }
    } catch {
      /* ignore */
    }
  }
  return undefined;
}

function pickBestUrls(pictures: MeliPicture[]): string[] {
  const urls: string[] = [];
  for (const p of pictures) {
    const u = p.max_size || p.secure_url || p.url;
    if (u) urls.push(normalizeMeliImageUrl(u));
  }
  return [...new Set(urls)];
}

async function fetchItemFromApi(
  itemId: string,
  token?: string
): Promise<MeliItem | null> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`https://api.mercadolibre.com/items/${itemId}`, {
    headers,
  });

  if (res.status === 404) {
    throw new Error(`Publicación no encontrada: ${itemId}`);
  }
  if (!res.ok) {
    return null;
  }

  return (await res.json()) as MeliItem;
}

function extractFromHtml(html: string): { title?: string; urls: string[] } {
  const urls = new Set<string>();

  let title = titleFromJsonLd(html);
  if (!title) {
    const ogTitle = html.match(
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i
    );
    if (ogTitle?.[1]) title = cleanMeliProductTitle(ogTitle[1]);
  }

  const ldBlocks = html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );
  for (const block of ldBlocks) {
    try {
      const data = JSON.parse(block[1]) as { image?: string | string[] };
      const imgs = data.image;
      if (!imgs) continue;
      const list = Array.isArray(imgs) ? imgs : [imgs];
      for (const u of list) {
        if (typeof u === "string") urls.add(normalizeMeliImageUrl(u));
      }
    } catch {
      /* ignore invalid json */
    }
  }

  const re =
    /https?:\/\/[^"'\s]*mlstatic\.com[^"'\s]+\.(?:jpe?g|png|webp)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    urls.add(normalizeMeliImageUrl(m[0]));
  }

  const ogImg = html.match(
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i
  );
  if (ogImg?.[1]) urls.add(normalizeMeliImageUrl(ogImg[1]));

  return {
    title,
    urls: filterGalleryUrls([...urls]),
  };
}

type PlaywrightBrowser = import("playwright").Browser;
type PlaywrightPage = import("playwright").Page;

async function extractProductTitleFromPage(page: PlaywrightPage): Promise<string> {
  const raw = await page.evaluate(() => {
    const selectors = [
      "h1.ui-pdp-title",
      "h1.poly-component__title",
      "h1.andes-visually-hidden + h1",
      "h1",
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      const text = el?.textContent?.trim();
      if (text && text.length > 3) return text;
    }

    for (const script of document.querySelectorAll(
      'script[type="application/ld+json"]'
    )) {
      try {
        const data = JSON.parse(script.textContent || "") as unknown;
        const list = Array.isArray(data) ? data : [data];
        for (const item of list) {
          if (
            item &&
            typeof item === "object" &&
            (item as { "@type"?: string })["@type"] === "Product" &&
            typeof (item as { name?: string }).name === "string"
          ) {
            return (item as { name: string }).name;
          }
        }
      } catch {
        /* ignore */
      }
    }

    const og = document.querySelector('meta[property="og:title"]');
    if (og) return og.getAttribute("content") || "";
    return document.title;
  });

  const cleaned = cleanMeliProductTitle(raw);
  return cleaned || raw.trim();
}

async function fetchItemFromPlaywright(
  itemId: string,
  sourceUrl: string | undefined,
  browser: PlaywrightBrowser
): Promise<{ title: string; urls: string[] }> {
  const pageUrl =
    sourceUrl?.startsWith("http") ? sourceUrl : itemIdToArticuloUrl(itemId);

  const context = await browser.newContext({
    locale: "es-AR",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    viewport: { width: 1366, height: 900 },
  });
  const page = await context.newPage();

  try {
    await page.goto(pageUrl, {
      waitUntil: "domcontentloaded",
      timeout: 120_000,
    });

    const cookieBtn = page.locator(
      'button:has-text("Aceptar cookies"), button:has-text("Aceptar")'
    );
    if (await cookieBtn.first().isVisible({ timeout: 2500 }).catch(() => false)) {
      await cookieBtn.first().click().catch(() => {});
    }

    await page.waitForTimeout(5000);
    await page
      .waitForSelector("h1.ui-pdp-title, h1", { timeout: 20_000 })
      .catch(() => {});

    const title = await extractProductTitleFromPage(page);
    const html = await page.content();
    const fromHtml = extractFromHtml(html);

    if (fromHtml.urls.length > 0) {
      return {
        title: fromHtml.title || title || itemId,
        urls: fromHtml.urls,
      };
    }

    throw new Error("Playwright no encontró fotos de galería en la página");
  } finally {
    await context.close();
  }
}

async function fetchItemFromPage(itemId: string): Promise<{
  title?: string;
  urls: string[];
}> {
  const candidates = [
    itemIdToArticuloUrl(itemId),
    `https://www.mercadolibre.com.ar/p/${itemId}`,
  ];

  for (const url of candidates) {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "es-AR,es;q=0.9",
      },
      redirect: "follow",
    });

    if (!res.ok) continue;
    const html = await res.text();
    const parsed = extractFromHtml(html);
    if (parsed.urls.length > 0) return parsed;
  }

  throw new Error(
    `No se pudieron extraer imágenes de la página. Probá con MELI_ACCESS_TOKEN en .env.local`
  );
}

async function resolveImages(
  input: string,
  token: string | undefined,
  browser?: PlaywrightBrowser
): Promise<{ itemId: string; title: string; urls: string[] }> {
  const itemId = extractItemId(input);
  if (!itemId) {
    throw new Error(`No se encontró ID MLA/MLB/etc. en: ${input}`);
  }

  const sourceUrl = input.trim().startsWith("http") ? input.trim() : undefined;

  const apiItem = await fetchItemFromApi(itemId, token);
  if (apiItem?.pictures?.length) {
    const urls = filterGalleryUrls(pickBestUrls(apiItem.pictures));
    if (urls.length > 0) {
      return {
        itemId,
        title: cleanMeliProductTitle(apiItem.title || itemId),
        urls,
      };
    }
  }

  if (browser) {
    const fromPw = await fetchItemFromPlaywright(itemId, sourceUrl, browser);
    if (fromPw.urls.length > 0) {
      return { itemId, title: fromPw.title, urls: fromPw.urls };
    }
  }

  const fromPage = await fetchItemFromPage(itemId);
  if (fromPage.urls.length === 0) {
    throw new Error(
      apiItem === null
        ? `Sin fotos: API 403 y fetch simple bloqueado. Reintentá (usa Playwright automático en batch).`
        : `La publicación no tiene imágenes visibles (${itemId})`
    );
  }

  return {
    itemId,
    title: cleanMeliProductTitle(
      fromPage.title || apiItem?.title || itemId
    ),
    urls: fromPage.urls,
  };
}

async function downloadFile(url: string, dest: string): Promise<void> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; MadsJeez/1.0)",
      Referer: "https://www.mercadolibre.com.ar/",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 2_000) throw new Error(`archivo muy chico (${buf.length} bytes)`);
  fs.writeFileSync(dest, buf);
}

function safeFolderName(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

export async function processOne(
  input: string,
  opts: CliOptions,
  browser?: PlaywrightBrowser
): Promise<{ folder: string; count: number }> {
  const { itemId, title, urls } = await resolveImages(input, opts.token, browser);
  const productTitle = cleanMeliProductTitle(title) || itemId;
  const limited = urls.slice(0, opts.maxImages);
  const folderName = opts.folder || safeFolderName(productTitle);
  const outDir = path.join(PHOTO_BANK, folderName);

  console.log(`\n→ ${itemId}`);
  console.log(`  Título: ${productTitle}`);
  console.log(`  ${limited.length} imagen(es)`);
  console.log(`  Carpeta: ${outDir}`);

  if (opts.dryRun) {
    limited.forEach((u, i) => console.log(`    [${i + 1}] ${u}`));
    return { folder: folderName, count: limited.length };
  }

  fs.mkdirSync(outDir, { recursive: true });

  let saved = 0;
  for (let i = 0; i < limited.length; i++) {
    const url = limited[i];
    let ext = ".jpg";
    try {
      const p = new URL(url).pathname;
      const m = p.match(/\.(jpe?g|png|webp)$/i);
      if (m) ext = m[0].toLowerCase();
    } catch {
      /* keep default */
    }
    const fileName = `${String(i + 1).padStart(2, "0")}${ext}`;
    const dest = path.join(outDir, fileName);
    try {
      await downloadFile(url, dest);
      saved++;
      console.log(`  ✓ ${fileName}`);
    } catch (e) {
      console.warn(
        `  ✗ ${fileName}: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  if (saved === 0) throw new Error("No se guardó ninguna imagen");
  return { folder: folderName, count: saved };
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.inputs.length === 0) {
    console.error(`
Uso:
  npx tsx scripts/download-meli-images.ts "<link mercadolibre>"
  npx tsx scripts/download-meli-images.ts MLA1234567890
  npx tsx scripts/download-meli-images.ts --url "..." --folder "SKU - titulo"
  npx tsx scripts/download-meli-images.ts --urls links.txt

Opciones:
  --token      Access token MeLi (o MELI_ACCESS_TOKEN en .env.local)
  --folder     Nombre de carpeta en photo-bank
  --max N      Máximo de imágenes (default 12)
  --dry-run    Solo lista URLs

Ejemplo link:
  https://articulo.mercadolibre.com.ar/MLA-1234567890-nombre-del-producto
`);
    process.exit(1);
  }

  if (!opts.dryRun) fs.mkdirSync(PHOTO_BANK, { recursive: true });

  let ok = 0;
  let fail = 0;
  let browser: PlaywrightBrowser | undefined;

  try {
    const { chromium } = await import("playwright");
    browser = await chromium.launch({
      headless: true,
      args: ["--disable-blink-features=AutomationControlled"],
    });
    console.log("Navegador Playwright listo (Mercado Libre exige JS real).\n");

    for (const input of opts.inputs) {
      try {
        const r = await processOne(input, opts, browser);
        ok++;
        console.log(`  Listo: ${r.count} imagen(es)`);
      } catch (e) {
        fail++;
        console.error(
          `  Error: ${e instanceof Error ? e.message : String(e)}`
        );
      }
    }
  } finally {
    await browser?.close();
  }

  console.log(`\nResumen: ${ok} OK, ${fail} error(es). Photo bank: ${PHOTO_BANK}`);
  if (ok > 0 && !opts.dryRun) {
    console.log(
      "Siguiente: node scripts/match-photos.js --dry-run  (revisar) y luego sin --dry-run"
    );
  }

  process.exit(fail > 0 ? 1 : 0);
}

const isDirectRun = process.argv[1]?.replace(/\\/g, "/").includes("download-meli-images");
if (isDirectRun) {
  main();
}
