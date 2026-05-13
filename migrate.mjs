/**
 * Ejecuta `prisma migrate deploy`. Si `DATABASE_URL` es el pooler de Supabase (:6543),
 * usa `DIRECT_DATABASE_URL` / `SUPABASE_DATABASE_URL` en :5432 si existen; si no, intenta derivar
 * `db.<ref>.supabase.co:5432` desde el URI del pooler (usuario `postgres.<project_ref>`).
 * La app en runtime sigue usando las variables del proceso (no se modifica fuera de execSync).
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
 * Pooler "Transaction" de Supabase: usuario `postgres.<project_ref>` y host `*.pooler.supabase.com`.
 * La conexión directa para DDL/migrate es `db.<project_ref>.supabase.co:5432` con usuario `postgres`.
 * @see https://supabase.com/docs/guides/database/connecting-to-postgres
 */
function deriveSupabaseDirectFromPooler(poolerUrl) {
  if (!poolerUrl || typeof poolerUrl !== "string" || !looksLikePgPooler(poolerUrl)) return null;
  try {
    const normalized = poolerUrl.trim().replace(/^postgres:/i, "postgresql:");
    const parsed = new URL(normalized.replace(/^postgresql:/i, "http:"));
    if (!parsed.hostname.includes("pooler.supabase.com")) return null;

    const userDecoded = decodeURIComponent((parsed.username || "").replace(/\+/g, " "));
    let projectRef = "";
    if (userDecoded.startsWith("postgres.")) {
      projectRef = userDecoded.slice("postgres.".length).trim();
    }
    if (!projectRef || projectRef.length < 10) return null;

    const password = parsed.password ? decodeURIComponent(parsed.password.replace(/\+/g, " ")) : "";
    if (!password) return null;

    const path = (parsed.pathname || "/postgres").replace(/\/+/g, "/") || "/postgres";
    const qp = new URLSearchParams(parsed.search);
    qp.delete("pgbouncer");
    const qs = qp.toString();

    const directHost = `db.${projectRef}.supabase.co`;
    const u = encodeURIComponent("postgres");
    const p = encodeURIComponent(password);
    return `postgresql://${u}:${p}@${directHost}:5432${path}${qs ? `?${qs}` : ""}`;
  } catch {
    return null;
  }
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

  if (appPrimary && looksLikePgPooler(appPrimary)) {
    const derived = deriveSupabaseDirectFromPooler(appPrimary);
    if (derived) {
      return { migrateUrl: derived, appUrl: appPrimary, source: "derived_Supabase_pooler→db.*.supabase.co:5432" };
    }
  }

  if (appPrimary) {
    return { migrateUrl: appPrimary, appUrl: appPrimary, source: "DATABASE_URL|SUPABASE_DATABASE_URL" };
  }

  return { migrateUrl: "", appUrl: "", source: "" };
}

const { migrateUrl, appUrl, source } = pickMigrateDatabaseUrl();

if (looksLikePgPooler(appUrl) && !looksLikePgPooler(migrateUrl)) {
  const derivedNote =
    source === "derived_Supabase_pooler→db.*.supabase.co:5432"
      ? " (URI directa derivada del pooler: usuario postgres.<ref> de Supabase)."
      : "";
  console.log(
    `[migrate] Pooler para la app (${hostPortHint(appUrl)}); migrate deploy usa ${hostPortHint(migrateUrl)}${derivedNote}`
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
