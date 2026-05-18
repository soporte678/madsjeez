/**
 * Descarga imágenes de TODOS los productos de una tienda oficial en Mercado Libre.
 *
 * Uso:
 *   npx tsx scripts/download-meli-seller.ts --store bullservice
 *   npx tsx scripts/download-meli-seller.ts --store bullservice --limit 20
 *   npx tsx scripts/download-meli-seller.ts --store bullservice --discover-only
 *   npx tsx scripts/download-meli-seller.ts --resume
 *   npx tsx scripts/download-meli-seller.ts --resume --eco
 *     (10 productos / lote, 5 min de pausa, cierra Chrome entre lotes — bajo consumo)
 *   npx tsx scripts/download-meli-seller.ts --resume --eco --eco-batch 10 --eco-min 5
 *
 * Por defecto: tienda BULLSERVICE (vendedor de los links de prueba).
 * Carpetas en photo-bank/ con solo el título del producto.
 */

import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import type { Browser, Page } from "playwright";
import {
  processOne,
  type CliOptions as ImageCliOptions,
} from "./download-meli-images";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const PHOTO_BANK =
  process.env.PHOTO_BANK_PATH || path.join(process.cwd(), "photo-bank");
const CACHE_DIR = path.join(process.cwd(), "scripts", ".cache");

type Progress = {
  store: string;
  itemIds: string[];
  completed: Record<string, string>;
  failed: Record<string, string>;
  updatedAt: string;
};

type SellerCli = {
  store: string;
  limit: number;
  discoverOnly: boolean;
  resume: boolean;
  dryRun: boolean;
  maxImages: number;
  eco: boolean;
  ecoBatch: number;
  ecoIntervalMin: number;
};

function parseArgs(argv: string[]): SellerCli {
  const opts: SellerCli = {
    store: "bullservice",
    limit: Infinity,
    discoverOnly: false,
    resume: false,
    dryRun: false,
    maxImages: 12,
    eco: false,
    ecoBatch: 10,
    ecoIntervalMin: 5,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--store") opts.store = argv[++i].replace(/^@/, "");
    else if (a === "--limit") opts.limit = parseInt(argv[++i], 10) || 20;
    else if (a === "--discover-only") opts.discoverOnly = true;
    else if (a === "--resume") opts.resume = true;
    else if (a === "--dry-run") opts.dryRun = true;
    else if (a === "--max") opts.maxImages = parseInt(argv[++i], 10) || 12;
    else if (a === "--eco") opts.eco = true;
    else if (a === "--eco-batch")
      opts.ecoBatch = Math.max(1, parseInt(argv[++i], 10) || 10);
    else if (a === "--eco-min")
      opts.ecoIntervalMin = Math.max(1, parseInt(argv[++i], 10) || 5);
  }
  return opts;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Chrome más liviano; se cierra el navegador entre lotes (RAM casi cero en la pausa). */
function ecoChromiumLaunchOptions() {
  return {
    headless: true as const,
    args: [
      "--disable-blink-features=AutomationControlled",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--disable-extensions",
      "--disable-background-networking",
      "--disable-sync",
      "--mute-audio",
      "--no-first-run",
    ],
  };
}

async function runEcoDownloadLoop(
  chromium: typeof import("playwright").chromium,
  progress: Progress,
  imageOpts: ImageCliOptions,
  batchSize: number,
  intervalMin: number
) {
  const RETRIES = 3;
  const PAUSE_BETWEEN_MS = 4000;
  const intervalMs = intervalMin * 60_000;
  let totalOk = 0;
  let totalFail = 0;
  let lot = 0;

  while (true) {
    const pending = progress.itemIds.filter((id) => !progress.completed[id]);
    if (pending.length === 0) {
      console.log("\n✅ No quedan pendientes. Proceso terminado.");
      break;
    }

    const chunk = pending.slice(0, batchSize);
    lot++;
    console.log(
      `\n──────── Lote ${lot} — ${chunk.length} productos (${pending.length} pendientes) — ${new Date().toLocaleString("es-AR")} ────────`
    );

    const browser = await chromium.launch(ecoChromiumLaunchOptions());
    try {
      for (let i = 0; i < chunk.length; i++) {
        const itemId = chunk[i];
        console.log(`\n[${i + 1}/${chunk.length}] ${itemId}`);
        let done = false;
        for (let attempt = 1; attempt <= RETRIES && !done; attempt++) {
          if (attempt > 1) {
            console.log(`   Reintento ${attempt}/${RETRIES}...`);
            await sleep(PAUSE_BETWEEN_MS * attempt);
          }
          try {
            const r = await processOne(itemId, imageOpts, browser);
            progress.completed[itemId] = r.folder;
            delete progress.failed[itemId];
            totalOk++;
            done = true;
            console.log(`   ✓ ${r.count} imagen(es) → ${r.folder}`);
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            if (attempt === RETRIES) {
              progress.failed[itemId] = msg;
              totalFail++;
              console.error(`   ✗ ${msg}`);
            }
          }
        }
        saveProgress(progress);
        await sleep(PAUSE_BETWEEN_MS);
      }
    } finally {
      await browser.close().catch(() => {});
    }

    const still = progress.itemIds.filter((id) => !progress.completed[id]);
    saveProgress(progress);
    console.log(
      `\n📊 Tras el lote: OK acum. ${totalOk} | fallos acum. ${totalFail} | completados en JSON: ${Object.keys(progress.completed).length}`
    );

    if (still.length === 0) {
      console.log("\n✅ Catálogo completo. Cerrando.");
      break;
    }

    console.log(
      `\n💤 Pausa ${intervalMin} min (navegador cerrado, bajo consumo). Quedan ${still.length} productos.`
    );
    await sleep(intervalMs);
  }

  console.log(`\n════════════════════════════════════`);
  console.log(`Resumen modo eco`);
  console.log(`  OK este run: ${totalOk}  |  Error este run: ${totalFail}`);
  console.log(`  Total completados: ${Object.keys(progress.completed).length} / ${progress.itemIds.length}`);
  console.log(`  Photo bank: ${PHOTO_BANK}`);
  console.log(`  Progreso: ${progressPath(progress.store)}`);
}

function progressPath(store: string) {
  return path.join(CACHE_DIR, `meli-store-${store}-progress.json`);
}

function loadProgress(store: string): Progress | null {
  const p = progressPath(store);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8")) as Progress;
}

function saveProgress(progress: Progress) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  progress.updatedAt = new Date().toISOString();
  fs.writeFileSync(progressPath(progress.store), JSON.stringify(progress, null, 2));
}

/** IDs de publicación activa (wid / item_id), no IDs de catálogo /p/MLA… */
function extractListingItemIds(text: string): string[] {
  const ids = new Set<string>();
  for (const m of text.matchAll(/wid=(MLA\d+)/gi)) ids.add(m[1].toUpperCase());
  for (const m of text.matchAll(/item_id%3D(MLA\d+)/gi)) ids.add(m[1].toUpperCase());
  for (const m of text.matchAll(/item_id=(MLA\d+)/gi)) ids.add(m[1].toUpperCase());
  for (const m of text.matchAll(
    /articulo\.mercadolibre[^"'\s]*\/(MLA-?\d+)/gi
  )) {
    ids.add(m[1].replace("-", "").toUpperCase());
  }
  return [...ids];
}

function attachIdCollector(page: Page): Set<string> {
  const ids = new Set<string>();
  page.on("response", async (res) => {
    try {
      const t = await res.text();
      if (t.length > 4_000_000 || !t.includes("MLA")) return;
      extractListingItemIds(t).forEach((id) => ids.add(id));
    } catch {
      /* ignore */
    }
  });
  return ids;
}

async function collectFromListingPage(
  page: Page,
  url: string,
  ids: Set<string>
) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await page.waitForTimeout(8000);
  const html = await page.content();
  if (html.length < 50_000) {
    await page.waitForTimeout(5000);
  }
  extractListingItemIds(await page.content()).forEach((id) => ids.add(id));

  const cookie = page.locator(
    'button:has-text("Aceptar cookies"), button:has-text("Aceptar")'
  );
  if (await cookie.first().isVisible({ timeout: 2000 }).catch(() => false)) {
    await cookie.first().click().catch(() => {});
    await page.waitForTimeout(1000);
  }
}

async function paginateListing(page: Page, ids: Set<string>, maxPages = 30) {
  for (let p = 0; p < maxPages; p++) {
    const before = ids.size;
    const next = page.locator(
      'a.andes-pagination__link[title="Siguiente"], li.andes-pagination__button--next a'
    );
    if (!(await next.count())) break;
    await next.first().click().catch(() => {});
    await page.waitForTimeout(5000);
    extractListingItemIds(await page.content()).forEach((id) => ids.add(id));
    if (ids.size === before) break;
  }
}

async function discoverCategoryUrls(
  browser: Browser,
  store: string
): Promise<string[]> {
  const root = `https://listado.mercadolibre.com.ar/tienda/${store}/`;
  const ctx = await newStoreContext(browser);
  const page = await ctx.newPage();
  await page.goto(root, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await page.waitForTimeout(8000);

  const cookie = page.locator(
    'button:has-text("Aceptar cookies"), button:has-text("Aceptar")'
  );
  if (await cookie.first().isVisible({ timeout: 2000 }).catch(() => false)) {
    await cookie.first().click().catch(() => {});
    await page.waitForTimeout(1000);
  }

  const urls = await page.evaluate(
    ({ base, slug }: { base: string; slug: string }) => {
      const out = new Set<string>([base]);
      document.querySelectorAll("a[href]").forEach((a) => {
        let href = (a as HTMLAnchorElement).href.split("#")[0];
        if (!href.includes(`/tienda/${slug}`)) return;
        if (href.includes("/listado/") || href.includes("_Desde_")) {
          if (!href.endsWith("/")) href += "/";
          out.add(href);
        }
      });
      return [...out];
    },
    { base: root, slug: store }
  );

  await ctx.close();
  if (urls.length <= 1) {
    console.warn("   ⚠ Pocas categorías detectadas; usando listado principal + herramientas.");
    return [
      root,
      `https://listado.mercadolibre.com.ar/tienda/${store}/listado/herramientas/`,
      `https://listado.mercadolibre.com.ar/tienda/${store}/listado/hogar-muebles-jardin/`,
      `https://listado.mercadolibre.com.ar/tienda/${store}/listado/construccion/`,
      `https://listado.mercadolibre.com.ar/tienda/${store}/listado/accesorios-vehiculos/`,
      `https://listado.mercadolibre.com.ar/tienda/${store}/listado/electronica-audio-video/`,
    ];
  }
  return urls;
}

async function newStoreContext(browser: Browser) {
  return browser.newContext({
    locale: "es-AR",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    viewport: { width: 1366, height: 900 },
  });
}

export async function discoverStoreItemIds(
  browser: Browser,
  store: string
): Promise<string[]> {
  console.log(`\n🔎 Buscando publicaciones en tienda: ${store}`);
  const categories = await discoverCategoryUrls(browser, store);
  console.log(`   ${categories.length} listados (categorías + raíz)`);

  const ctx = await newStoreContext(browser);
  const all = new Set<string>();
  for (const catUrl of categories) {
    const page = await ctx.newPage();
    const local = attachIdCollector(page);
    console.log(`   → ${catUrl.replace(/.*tienda\/[^/]+/, "…")}`);
    await collectFromListingPage(page, catUrl, local);
    await paginateListing(page, local);
    local.forEach((id) => all.add(id));
    console.log(`      ${local.size} IDs (acumulado: ${all.size})`);
    await page.close();
  }
  await ctx.close();

  const list = [...all].sort();
  console.log(`\n✅ Total publicaciones únicas: ${list.length}`);
  return list;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const { chromium } = await import("playwright");

  let progress = opts.resume ? loadProgress(opts.store) : null;
  if (!progress) {
    progress = {
      store: opts.store,
      itemIds: [],
      completed: {},
      failed: {},
      updatedAt: new Date().toISOString(),
    };
  }

  const browserLaunch = opts.eco
    ? ecoChromiumLaunchOptions()
    : {
        headless: true as const,
        args: ["--disable-blink-features=AutomationControlled"],
      };

  let browserInstance: Browser | null = await chromium.launch(browserLaunch);

  try {
    if (!opts.resume || progress.itemIds.length === 0) {
      progress.itemIds = await discoverStoreItemIds(browserInstance, opts.store);
      saveProgress(progress);
    } else {
      console.log(
        `\n📂 Reanudando: ${progress.itemIds.length} IDs en caché, ${Object.keys(progress.completed).length} ya descargados`
      );
    }

    if (opts.discoverOnly) {
      console.log(`\nIDs guardados en: ${progressPath(opts.store)}`);
      return;
    }

    const pending = progress.itemIds.filter((id) => !progress!.completed[id]);
    const retryFailed = pending.filter((id) => progress!.failed[id]);
    if (retryFailed.length) {
      console.log(
        `   (${retryFailed.length} con error anterior se reintentarán)`
      );
    }

    const imageOpts: ImageCliOptions = {
      inputs: [],
      maxImages: opts.maxImages,
      dryRun: opts.dryRun,
      token:
        process.env.MELI_ACCESS_TOKEN ||
        process.env.MERCADOLIBRE_ACCESS_TOKEN,
    };

    if (opts.eco) {
      await browserInstance.close().catch(() => {});
      browserInstance = null;
      console.log(
        `\n🌿 Modo eco: ${opts.ecoBatch} productos por lote, pausa ${opts.ecoIntervalMin} min entre lotes.`
      );
      await runEcoDownloadLoop(
        chromium,
        progress,
        imageOpts,
        opts.ecoBatch,
        opts.ecoIntervalMin
      );
      return;
    }

    const toProcess = pending.slice(0, opts.limit);
    console.log(
      `\n📥 Descargando imágenes: ${toProcess.length} productos (${pending.length} pendientes)`
    );

    let ok = 0;
    let fail = 0;
    let browserForImages: Browser = browserInstance!;
    const RETRIES = 3;
    const PAUSE_MS = 2500;
    const RESTART_EVERY = 15;

    for (let i = 0; i < toProcess.length; i++) {
      const itemId = toProcess[i];
      console.log(`\n[${i + 1}/${toProcess.length}] ${itemId}`);

      if (i > 0 && i % RESTART_EVERY === 0) {
        console.log("   ↻ Reiniciando navegador (evitar bloqueo MeLi)...");
        await browserForImages.close().catch(() => {});
        browserForImages = await chromium.launch({
          headless: true,
          args: ["--disable-blink-features=AutomationControlled"],
        });
        await new Promise((r) => setTimeout(r, 3000));
      }

      let done = false;
      for (let attempt = 1; attempt <= RETRIES && !done; attempt++) {
        if (attempt > 1) {
          console.log(`   Reintento ${attempt}/${RETRIES}...`);
          await new Promise((r) => setTimeout(r, PAUSE_MS * attempt));
        }
        try {
          const r = await processOne(itemId, imageOpts, browserForImages);
          progress.completed[itemId] = r.folder;
          delete progress.failed[itemId];
          ok++;
          done = true;
          console.log(`   ✓ ${r.count} imagen(es) → ${r.folder}`);
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          if (attempt === RETRIES) {
            progress.failed[itemId] = msg;
            fail++;
            console.error(`   ✗ ${msg}`);
          }
        }
      }
      saveProgress(progress);
      await new Promise((r) => setTimeout(r, PAUSE_MS));
    }

    if (browserForImages !== browserInstance) {
      await browserForImages.close().catch(() => {});
    }

    saveProgress(progress);
    console.log(`\n════════════════════════════════════`);
    console.log(`Resumen tienda ${opts.store}`);
    console.log(`  OK: ${ok}  |  Error: ${fail}`);
    console.log(`  Total en catálogo: ${progress.itemIds.length}`);
    console.log(`  Completados: ${Object.keys(progress.completed).length}`);
    console.log(`  Photo bank: ${PHOTO_BANK}`);
    console.log(`  Progreso: ${progressPath(opts.store)}`);
    if (pending.length > toProcess.length) {
      console.log(
        `\n⏳ Quedan ${pending.length - toProcess.length} productos. Ejecutá de nuevo con --resume`
      );
    }
  } finally {
    await browserInstance?.close().catch(() => {});
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
