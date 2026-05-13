/**
 * Ejecuta `prisma migrate deploy`. Si `DATABASE_URL` es el pooler de Supabase (:6543),
 * usa `DIRECT_DATABASE_URL` (o `SUPABASE_DATABASE_URL` en :5432) solo para migraciones.
 * La app en runtime sigue usando las variables del proceso (no se modifica aquí fuera de execSync).
 */
import { execSync } from "child_process";
import path from "path";
import { existsSync } from "fs";

try {
  const dotenv = await import("dotenv");
  const root = process.cwd();
  const envLocal = path.resolve(root, ".env.local");
  const envFile = path.resolve(root, ".env");
  if (existsSync(envLocal)) dotenv.config({ path: envLocal });
  else if (existsSync(envFile)) dotenv.config({ path: envFile });
} catch {
  /* dotenv opcional en CI */
}

function looksLikePgPooler(url) {
  if (!url || typeof url !== "string") return false;
  return url.includes(":6543") || url.includes(".pooler.supabase.com");
}

function hostPortHint(url) {
  if (!url || typeof url !== "string") return "(sin url)";
  const m = url.match(/@([^/?]+)/);
  return m ? m[1] : "(host no detectado)";
}

/**
 * Prisma `migrate deploy` con pooler Supabase (:6543) suele colgar o fallar.
 * Si existe una URL directa (:5432 / host db.*), usala solo para este proceso.
 */
function pickMigrateDatabaseUrl() {
  const appPrimary = (process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL || "").trim();
  const explicitDirect = [
    process.env.DIRECT_DATABASE_URL,
    process.env.PRISMA_DIRECT_URL,
    process.env.DATABASE_URL_DIRECT,
  ]
    .filter((u) => typeof u === "string" && u.trim())
    .map((u) => u.trim());

  for (const u of explicitDirect) {
    if (!looksLikePgPooler(u)) {
      return { migrateUrl: u, appUrl: appPrimary || u, source: "DIRECT_DATABASE_URL|PRISMA_DIRECT_URL|DATABASE_URL_DIRECT" };
    }
  }

  const supa = (process.env.SUPABASE_DATABASE_URL || "").trim();
  if (appPrimary && looksLikePgPooler(appPrimary) && supa && !looksLikePgPooler(supa)) {
    return { migrateUrl: supa, appUrl: appPrimary, source: "SUPABASE_DATABASE_URL" };
  }

  if (appPrimary) {
    return { migrateUrl: appPrimary, appUrl: appPrimary, source: "DATABASE_URL|SUPABASE_DATABASE_URL" };
  }

  return { migrateUrl: "", appUrl: "", source: "" };
}

const { migrateUrl, appUrl, source } = pickMigrateDatabaseUrl();

if (looksLikePgPooler(appUrl) && !looksLikePgPooler(migrateUrl)) {
  console.log(
    `[migrate] URL de app parece pooler (${hostPortHint(appUrl)}); migrate deploy usa conexión directa (${hostPortHint(migrateUrl)}), origen: ${source}.`
  );
} else if (looksLikePgPooler(migrateUrl) && !process.env.PRISMA_MIGRATE_POOLER_OK) {
  console.warn(
    "[migrate] La URL usada para migrate deploy sigue siendo el pooler (:6543 / pooler.*). " +
      "`prisma migrate deploy` suele necesitar la URL directa (:5432, host db.*.supabase.co). " +
      "Definí DIRECT_DATABASE_URL en Railway o exportá PRISMA_MIGRATE_POOLER_OK=1 para silenciar este aviso."
  );
}

if (!migrateUrl) {
  console.error(
    "Falta DATABASE_URL (o SUPABASE_DATABASE_URL). Configúrala en .env.local o en variables del CI/hosting."
  );
  process.exit(1);
}

try {
  console.log("Ejecutando migraciones...");
  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: migrateUrl },
    stdio: "inherit",
    cwd: process.cwd(),
  });
} catch (error) {
  console.error("Error:", error);
  process.exit(1);
}
