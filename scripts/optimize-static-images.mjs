/**
 * Comprime PNG/JPG en public/team → WebP (calidad ~82, sin pérdida visible).
 * Uso: node scripts/optimize-static-images.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const teamDir = path.join(__dirname, "..", "public", "team");

async function main() {
  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    console.error("Instalá sharp: npm install -D sharp");
    process.exit(1);
  }

  if (!fs.existsSync(teamDir)) {
    console.log("No existe public/team");
    return;
  }

  const files = fs.readdirSync(teamDir).filter((f) => /\.(png|jpe?g)$/i.test(f));
  for (const file of files) {
    const input = path.join(teamDir, file);
    const base = file.replace(/\.(png|jpe?g)$/i, "");
    const output = path.join(teamDir, `${base}.webp`);
    const before = fs.statSync(input).size;
    await sharp(input)
      .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toFile(output);
    const after = fs.statSync(output).size;
    console.log(`${file} → ${base}.webp (${Math.round(before / 1024)}KB → ${Math.round(after / 1024)}KB)`);
  }
  console.log("Listo. Actualizá rutas en src/lib/company.ts a .webp si aún usan .png");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
