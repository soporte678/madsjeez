import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "public/brand/madsjeez-logo.png");
const icon512 = path.join(root, "public/brand/madsjeez-icon-512.png");

const meta = await sharp(src).metadata();
const w = meta.width ?? 1024;
const h = meta.height ?? 1024;
/** Icono cuadrado en la parte superior del arte vertical */
const size = Math.min(w, Math.round(h * 0.68));
const left = Math.max(0, Math.floor((w - size) / 2));

await sharp(src)
  .extract({ left, top: 0, width: size, height: size })
  .resize(512, 512)
  .png()
  .toFile(icon512);

await sharp(icon512).resize(32, 32).png().toFile(path.join(root, "src/app/icon.png"));
await sharp(icon512).resize(180, 180).png().toFile(path.join(root, "src/app/apple-icon.png"));

console.log("OK", { w, h, crop: size, left });
