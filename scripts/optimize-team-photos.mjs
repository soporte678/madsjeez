#!/usr/bin/env node
/**
 * scripts/optimize-team-photos.mjs
 *
 * Convierte todas las .png en public/team/ a .webp (quality 78).
 * Las .webp ya existen en este repo, pero este script sirve para
 * mantenerlas sincronizadas cuando se agregan fotos nuevas o se
 * actualizan los originales.
 *
 * Uso:
 *   node scripts/optimize-team-photos.mjs
 *
 * Requiere `sharp` instalado. Si falta:
 *   npm i -D sharp
 */
import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.cwd(), "public/team");
const QUALITY = 78;

async function main() {
  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    console.error("ERROR: instalá sharp -> npm i -D sharp");
    process.exit(1);
  }

  const files = await fs.readdir(ROOT);
  const pngs = files.filter((f) => f.toLowerCase().endsWith(".png"));
  if (!pngs.length) {
    console.log("No hay .png para procesar en", ROOT);
    return;
  }

  let totalIn = 0;
  let totalOut = 0;
  for (const file of pngs) {
    const inPath = path.join(ROOT, file);
    const outPath = path.join(ROOT, file.replace(/\.png$/i, ".webp"));
    const inStat = await fs.stat(inPath);
    await sharp(inPath).webp({ quality: QUALITY }).toFile(outPath);
    const outStat = await fs.stat(outPath);
    totalIn += inStat.size;
    totalOut += outStat.size;
    console.log(
      `${file}  ${(inStat.size / 1024).toFixed(0)}KB -> ${(outStat.size / 1024).toFixed(0)}KB`,
    );
  }
  console.log(
    `\nTotal: ${(totalIn / 1024).toFixed(0)}KB -> ${(totalOut / 1024).toFixed(0)}KB (${(
      (1 - totalOut / totalIn) * 100
    ).toFixed(1)}% ahorro)`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
