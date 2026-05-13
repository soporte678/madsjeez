/**
 * Ejecuta `prisma migrate deploy`. Si `DATABASE_URL` es el pooler Supabase en **transaction** (:6543),
 * por defecto deriva la URI de **Supavisor session** (mismo host `*.pooler.supabase.com`, puerto **5432**,
 * usuario `postgres.<ref>`) — compatible con **IPv4** (Railway, etc.). El host `db.*.supabase.co:5432`
 * suele ser solo IPv6 y puede dar P1001 desde esos entornos.
 * `DIRECT_DATABASE_URL` / `PRISMA_DIRECT_URL`: si es host `db.*.supabase.co` y la app usa pooler :6543, se ignora
 * (IPv6-only) y se deriva session. Una URI **Session mode** (`*.pooler.supabase.com:5432`) sí se respeta.
 * @see https://supabase.com/docs/guides/database/connecting-to-postgres
 */
import { execSync } from "child_process";
import path from "path";
import { existsSync } from "fs";

const MIGRATE_SCRIPT_TAG = "migrate.mjs 20260514b (session default; ignora DIRECT db.* + transaction :6543 si app=pooler)";

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

/** Pooler Supabase en modo transaction (no usar para `migrate deploy`). */
function looksLikeSupabaseTransactionPooler6543(url) {
  if (!url || typeof url !== "string") return false;
  return url.includes(":6543") && url.includes("pooler.supabase.com");
}

function hostPortHint(url) {
  if (!url || typeof url !== "string") return "(sin url)";
  const m = url.match(/@([^/?]+)/);
  return m ? m[1] : "(host no detectado)";
}

function looksLikeSupabaseDirectDbIpv6Host(url) {
  if (!url || typeof url !== "string") return false;
  return /db\.[a-z0-9]+\.supabase\.co/i.test(url);
}

/**
 * Recomendado para `migrate deploy` desde PaaS **solo IPv4** (p. ej. Railway); el host `db.*.supabase.co` es IPv6 por defecto.
 * @see https://supabase.com/docs/guides/database/connecting-to-postgres#pooler-session-mode
 */
function deriveSupabaseSessionPoolerFromTransactionPooler(poolerUrl) {
  if (!poolerUrl || typeof poolerUrl !== "string" || !looksLikePgPooler(poolerUrl)) return null;
  try {
    const normalized = poolerUrl.trim().replace(/^postgres:/i, "postgresql:");
    const parsed = new URL(normalized.replace(/^postgresql:/i, "http:"));
    if (!parsed.hostname.includes("pooler.supabase.com")) return null;

    const userDecoded = decodeURIComponent((parsed.username || "").replace(/\+/g, " "));
    if (!userDecoded.startsWith("postgres.")) return null;

    const password = parsed.password ? decodeURIComponent(parsed.password.replace(/\+/g, " ")) : "";
    if (!password) return null;

    const path = (parsed.pathname || "/postgres").replace(/\/+/g, "/") || "/postgres";
    const qp = new URLSearchParams(parsed.search);
    qp.delete("pgbouncer");
    const qs = qp.toString();

    const host = parsed.hostname;
    const u = encodeURIComponent(userDecoded);
    const p = encodeURIComponent(password);
    return `postgresql://${u}:${p}@${host}:5432${path}${qs ? `?${qs}` : ""}`;
  } catch {
    return null;
  }
}

/**
 * Pooler "Transaction" de Supabase: usuario `postgres.<project_ref>` y host `*.pooler.supabase.com`.
 * Conexión **directa** al Postgres del proyecto: `db.<project_ref>.supabase.co:5432` con usuario `postgres`.
 * Útil con IPv6 o add-on IPv4; muchos contenedores en IPv4-only no alcanzan este host (P1001).
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
 * Prisma `migrate deploy`: con Supabase + pooler transaction (:6543), priorizar **session pooler :5432**
 * (IPv4-friendly). Opcional: `PRISMA_MIGRATE_SUPABASE_USE_DB_HOST=1` para forzar derivación a `db.*:5432`.
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
    if (looksLikeSupabaseTransactionPooler6543(u)) {
      console.warn(
        "[migrate] Ignorando DIRECT_* con pooler transaction :6543; no es válido para migrate deploy. Usá session :5432 o dejá vacío."
      );
      continue;
    }
    if (looksLikeSupabaseDirectDbIpv6Host(u) && looksLikePgPooler(appPrimary)) {
      console.warn(
        "[migrate] Ignorando DIRECT_DATABASE_URL / PRISMA_DIRECT_URL con host db.*.supabase.co: en Railway suele ser IPv6-only. " +
          "Con DATABASE_URL pooler :6543 se usará Supavisor session :5432. Quitá esa variable o usá la URI **Session mode** del panel Supabase (Connect → Session)."
      );
      continue;
    }
    return { migrateUrl: u, appUrl: appPrimary || u, source: "DIRECT_DATABASE_URL|PRISMA_DIRECT_URL|DATABASE_URL_DIRECT" };
  }

  const supa = (process.env.SUPABASE_DATABASE_URL || "").trim();
  if (
    appPrimary &&
    looksLikePgPooler(appPrimary) &&
    supa &&
    !looksLikePgPooler(supa) &&
    !looksLikeSupabaseDirectDbIpv6Host(supa)
  ) {
    return { migrateUrl: supa, appUrl: appPrimary, source: "SUPABASE_DATABASE_URL" };
  }

  if (appPrimary && looksLikePgPooler(appPrimary)) {
    const useDbHost =
      String(process.env.PRISMA_MIGRATE_SUPABASE_USE_DB_HOST || "").trim() === "1" ||
      String(process.env.PRISMA_MIGRATE_SUPABASE_USE_DB_HOST || "").toLowerCase() === "true";

    if (useDbHost) {
      const derivedDirect = deriveSupabaseDirectFromPooler(appPrimary);
      if (derivedDirect) {
        return {
          migrateUrl: derivedDirect,
          appUrl: appPrimary,
          source: "derived_Supabase_pooler→db.*.supabase.co:5432(PRISMA_MIGRATE_SUPABASE_USE_DB_HOST)",
        };
      }
    }

    const session = deriveSupabaseSessionPoolerFromTransactionPooler(appPrimary);
    if (session) {
      return {
        migrateUrl: session,
        appUrl: appPrimary,
        source: "derived_Supavisor_session_pooler:5432(IPv4-friendly)",
      };
    }

    const derivedDirect = deriveSupabaseDirectFromPooler(appPrimary);
    if (derivedDirect) {
      return { migrateUrl: derivedDirect, appUrl: appPrimary, source: "derived_Supabase_pooler→db.*.supabase.co:5432" };
    }
  }

  if (appPrimary) {
    return { migrateUrl: appPrimary, appUrl: appPrimary, source: "DATABASE_URL|SUPABASE_DATABASE_URL" };
  }

  return { migrateUrl: "", appUrl: "", source: "" };
}

/**
 * Afinar URL de migrate hacia Supabase: timeouts más largos y SSL explícito.
 * Ayuda con P1001 intermitentes desde hosting (cold start / ruta a :5432).
 */
function tuneMigrateDatabaseUrl(url) {
  if (!url || typeof url !== "string") return url;
  if (!/supabase\.co|pooler\.supabase\.com/i.test(url)) return url;
  let out = url.trim();
  const add = [];
  if (!/([?&])connect_timeout=/.test(out)) add.push("connect_timeout=60");
  if (!/([?&])sslmode=/.test(out)) add.push("sslmode=require");
  if (!add.length) return out;
  const sep = out.includes("?") ? "&" : "?";
  return `${out}${sep}${add.join("&")}`;
}

function sleepSyncSeconds(seconds) {
  const s = Math.max(1, Math.min(120, Math.floor(Number(seconds) || 10)));
  const until = Date.now() + s * 1000;
  while (Date.now() < until) {
    /* espera activa solo en migrate.mjs (boot en background) */
  }
}

const { migrateUrl, appUrl, source } = pickMigrateDatabaseUrl();
const tunedMigrateUrl = tuneMigrateDatabaseUrl(migrateUrl);

console.log(`[migrate] ${MIGRATE_SCRIPT_TAG}`);

if (appUrl && migrateUrl && migrateUrl !== appUrl) {
  const note = source.includes("session")
    ? " IPv4-friendly (Supavisor session; ver https://supabase.com/docs/guides/database/connecting-to-postgres )."
    : source.includes("db.*")
      ? " Host db.* (a menudo IPv6-only desde el PaaS; si falla, no fuerces PRISMA_MIGRATE_SUPABASE_USE_DB_HOST)."
      : "";
  console.log(
    `[migrate] Runtime DB ≈ ${hostPortHint(appUrl)} · migrate deploy → ${hostPortHint(tunedMigrateUrl)} · ${source}.${note}`
  );
} else if (
  looksLikePgPooler(tunedMigrateUrl) &&
  tunedMigrateUrl.includes(":6543") &&
  !process.env.PRISMA_MIGRATE_POOLER_OK
) {
  console.warn(
    "[migrate] migrate deploy usa el pooler en puerto 6543 (transaction). Suele fallar con Prisma; preferí session :5432 o DIRECT_DATABASE_URL. Podés exportar PRISMA_MIGRATE_POOLER_OK=1 para silenciar."
  );
}

if (!migrateUrl) {
  console.error(
    "Falta DATABASE_URL (o SUPABASE_DATABASE_URL). Configúrala en .env.local o en variables del CI/hosting."
  );
  process.exit(1);
}

try {
  const maxAttempts = Math.max(1, Math.min(12, Number(process.env.PRISMA_MIGRATE_ATTEMPTS || "5") || 5));
  const delaySec = Math.max(2, Math.min(90, Number(process.env.PRISMA_MIGRATE_RETRY_SLEEP_SEC || "10") || 10));
  let lastErr = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      console.log(`Ejecutando migraciones (intento ${attempt}/${maxAttempts})...`);
      execSync("npx prisma migrate deploy", {
        env: { ...process.env, DATABASE_URL: tunedMigrateUrl },
        stdio: "inherit",
        cwd: process.cwd(),
      });
      lastErr = null;
      break;
    } catch (error) {
      lastErr = error;
      console.error(`[migrate] Intento ${attempt}/${maxAttempts} falló.`, error?.message || error);
      if (attempt < maxAttempts) {
        console.warn(
          `[migrate] Reintento en ${delaySec}s. Si sigue P1001 con host db.*: el runtime puede ser IPv4-only; este script ya prioriza Supavisor session :5432 desde el pooler. Opcional: URI session del panel Supabase (Connect → Session mode) en DIRECT_DATABASE_URL.`
        );
        sleepSyncSeconds(delaySec);
      }
    }
  }
  if (lastErr) {
    console.error("Error:", lastErr);
    process.exit(1);
  }
} catch (error) {
  console.error("Error:", error);
  process.exit(1);
}
