/**
 * Ejecuta `prisma migrate deploy`. Si `DATABASE_URL` es el pooler Supabase en **transaction** (:6543),
 * por defecto deriva la URI de **Supavisor session** (mismo host `*.pooler.supabase.com`, puerto **5432**,
 * usuario `postgres.<ref>`) — compatible con **IPv4** (Railway, etc.). El host `db.*.supabase.co:5432`
 * suele ser solo IPv6 y puede dar P1001 desde esos entornos.
 * `DIRECT_DATABASE_URL` / `PRISMA_DIRECT_URL`: si es host `db.*.supabase.co` y la app usa pooler :6543, se ignora
 * (IPv6-only) y se deriva session. Una URI **Session mode** (`*.pooler.supabase.com:5432`) sí se respeta.
 * @see https://supabase.com/docs/guides/database/connecting-to-postgres
 *
 * P3009 conocido `20260504174800_add_access_key`: si el probe confirma si existe la columna `users.access_key`,
 * por defecto se ejecuta `prisma migrate resolve --applied` o `--rolled-back` y se reintenta `migrate deploy`.
 * Desactivar: `PRISMA_MIGRATE_AUTO_RESOLVE_ACCESS_KEY=0` o `false`.
 */
import { spawnSync } from "child_process";
import path from "path";
import { existsSync } from "fs";

const MIGRATE_SCRIPT_TAG = "migrate.mjs 20260514f (P3009 add_access_key auto-resolve)";

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

/** Host Supabase (pooler o db) en la cadena de conexión — para TLS/URL tuning sin afectar otros Postgres. */
function looksLikeSupabasePostgresUrl(url) {
  if (!url || typeof url !== "string") return false;
  return /supabase\.co|pooler\.supabase\.com/i.test(url);
}

/**
 * Quita `sslmode` / `ssl` del query string para usar solo `ssl` en opciones de `pg` Client (evita warning y duplicado).
 */
function postgresConnectionStringWithoutSslQueryParams(url) {
  if (!url || typeof url !== "string") return url;
  try {
    const trimmed = url.trim();
    const preferPostgresScheme = /^postgres:\/\//i.test(trimmed);
    const normalized = trimmed.replace(/^postgres:/i, "postgresql:");
    const parsed = new URL(normalized.replace(/^postgresql:/i, "http:"));
    const qp = new URLSearchParams(parsed.search);
    qp.delete("sslmode");
    qp.delete("ssl");
    const qs = qp.toString();
    const path = (parsed.pathname || "/").replace(/\/+/g, "/") || "/";
    const port = parsed.port ? `:${parsed.port}` : "";
    const userDecoded = decodeURIComponent((parsed.username || "").replace(/\+/g, " "));
    const passDecoded = parsed.password ? decodeURIComponent(parsed.password.replace(/\+/g, " ")) : "";
    const auth =
      userDecoded !== "" || passDecoded !== ""
        ? `${encodeURIComponent(userDecoded)}${passDecoded !== "" ? `:${encodeURIComponent(passDecoded)}` : ""}@`
        : "";
    const scheme = preferPostgresScheme ? "postgres" : "postgresql";
    return `${scheme}://${auth}${parsed.hostname}${port}${path}${qs ? `?${qs}` : ""}`;
  } catch {
    return url;
  }
}

/**
 * Afinar URL de migrate hacia Supabase: timeouts más largos y SSL explícito.
 * Ayuda con P1001 intermitentes desde hosting (cold start / ruta a :5432).
 */
function tuneMigrateDatabaseUrl(url) {
  if (!url || typeof url !== "string") return url;
  if (!looksLikeSupabasePostgresUrl(url)) return url;
  let out = url.trim();
  const add = [];
  if (!/([?&])connect_timeout=/.test(out)) add.push("connect_timeout=60");
  if (!/([?&])sslmode=/.test(out)) add.push("sslmode=require");
  if (!add.length) return out;
  const sep = out.includes("?") ? "&" : "?";
  return `${out}${sep}${add.join("&")}`;
}

function extractFailedMigrationNameFromPrismaOutput(combined) {
  const m = combined.match(/The `([^`]+)` migration/);
  return m?.[1] ?? null;
}

// #region agent log
function agentDebugLog(payload) {
  fetch("http://127.0.0.1:7607/ingest/af0ba961-993a-4927-ba69-95e1c7aba345", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "ff838a" },
    body: JSON.stringify({
      sessionId: "ff838a",
      timestamp: Date.now(),
      runId: process.env.AGENT_DEBUG_RUN_ID || "pre-fix",
      ...payload,
    }),
  }).catch(() => {});
}
// #endregion

/**
 * Consulta liviana vía pg (misma URL que migrate deploy) para desambiguar P3009 en `add_access_key`.
 * No loguea credenciales ni PII.
 */
async function probeUsersAccessKeyColumn(dbUrl) {
  if (!dbUrl || typeof dbUrl !== "string") return { ok: false, reason: "no-url" };
  try {
    const { Client } = await import("pg");
    const supabaseTls = looksLikeSupabasePostgresUrl(dbUrl);
    const connectionString = supabaseTls ? postgresConnectionStringWithoutSslQueryParams(dbUrl) : dbUrl;
    const client = new Client({
      connectionString,
      connectionTimeoutMillis: 25_000,
      ...(supabaseTls ? { ssl: { rejectUnauthorized: false } } : {}),
    });
    await client.connect();
    const r = await client.query(
      `select exists (
         select 1 from information_schema.columns
         where table_schema = 'public' and table_name = 'users' and column_name = 'access_key'
       ) as "accessKeyExists"`
    );
    await client.end();
    return { ok: true, exists: Boolean(r.rows[0]?.accessKeyExists) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg.slice(0, 320) };
  }
}

function sleepSyncSeconds(seconds) {
  const s = Math.max(1, Math.min(120, Math.floor(Number(seconds) || 10)));
  const until = Date.now() + s * 1000;
  while (Date.now() < until) {
    /* espera activa solo en migrate.mjs (boot en background) */
  }
}

/**
 * Ejecuta `prisma migrate deploy` y devuelve salida combinada (para detectar P3009 en logs).
 */
function runPrismaMigrateDeploy(dbUrl) {
  const r = spawnSync("npx", ["prisma", "migrate", "deploy"], {
    env: { ...process.env, DATABASE_URL: dbUrl },
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 50 * 1024 * 1024,
    stdio: ["inherit", "pipe", "pipe"],
  });
  const stdout = r.stdout ?? "";
  const stderr = r.stderr ?? "";
  if (stdout) process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);
  const combined = `${stdout}\n${stderr}`;
  return { status: r.status === 0 ? 0 : r.status ?? 1, combined };
}

/**
 * `prisma migrate resolve --applied|--rolled-back <name>` (misma DATABASE_URL que migrate deploy).
 */
function runPrismaMigrateResolve(dbUrl, migrationName, applied) {
  const flag = applied ? "--applied" : "--rolled-back";
  const r = spawnSync("npx", ["prisma", "migrate", "resolve", flag, migrationName], {
    env: { ...process.env, DATABASE_URL: dbUrl },
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 50 * 1024 * 1024,
    stdio: ["inherit", "pipe", "pipe"],
  });
  const stdout = r.stdout ?? "";
  const stderr = r.stderr ?? "";
  if (stdout) process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);
  const combined = `${stdout}\n${stderr}`;
  return { status: r.status === 0 ? 0 : r.status ?? 1, combined };
}

function printP3009Hints(combined) {
  const name = extractFailedMigrationNameFromPrismaOutput(combined) ?? "(nombre en el log arriba)";
  console.error(
    `[migrate] P3009 — Prisma registró una migración fallida: \`${name}\`. Reintentar el deploy **no** lo soluciona.\n` +
      "Opciones (misma URL que usa migrate, p. ej. session pooler :5432):\n" +
      "  1) Revisá en Supabase → SQL Editor: SELECT migration_name, finished_at, logs FROM \"_prisma_migrations\" ORDER BY started_at DESC LIMIT 15;\n" +
      "  2) Si el SQL de esa migración **ya está** en la base (ej. la columna/tablas existen): ejecutá una vez:\n" +
      `       DATABASE_URL='…' npx prisma migrate resolve --applied "${name}"\n` +
      "  3) Si **no** se aplicó y querés que Prisma vuelva a intentarla:\n" +
      `       DATABASE_URL='…' npx prisma migrate resolve --rolled-back "${name}"\n` +
      "     y luego redeploy / volvé a correr migrate deploy.\n" +
      "Doc: https://pris.ly/d/migrate-resolve"
  );
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

await (async function runMigrate() {
  try {
    // #region agent log
    agentDebugLog({
      hypothesisId: "H4",
      location: "migrate.mjs:runMigrate:boot",
      message: "migrate-target",
      data: { hostHint: hostPortHint(tunedMigrateUrl), source },
    });
    // #endregion

    const maxAttempts = Math.max(1, Math.min(12, Number(process.env.PRISMA_MIGRATE_ATTEMPTS || "5") || 5));
    const delaySec = Math.max(2, Math.min(90, Number(process.env.PRISMA_MIGRATE_RETRY_SLEEP_SEC || "10") || 10));
    let lastErr = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      console.log(`Ejecutando migraciones (intento ${attempt}/${maxAttempts})...`);
      const { status, combined } = runPrismaMigrateDeploy(tunedMigrateUrl);
      if (status === 0) {
        lastErr = null;
        break;
      }
      lastErr = new Error(combined.trim() || `prisma migrate deploy exit ${status}`);
      console.error(`[migrate] Intento ${attempt}/${maxAttempts} falló.`, combined.slice(0, 800));

      if (combined.includes("P3009")) {
        const failedName = extractFailedMigrationNameFromPrismaOutput(combined);
        printP3009Hints(combined);
        // #region agent log
        agentDebugLog({
          hypothesisId: "H1",
          location: "migrate.mjs:p3009",
          message: "prisma-blocks-new-migrations",
          data: { failedMigration: failedName, hasP3009: true },
        });
        // #endregion

        if (failedName === "20260504174800_add_access_key") {
          const probe = await probeUsersAccessKeyColumn(tunedMigrateUrl);
          const recommend =
            probe.ok && probe.exists === true
              ? "applied"
              : probe.ok && probe.exists === false
                ? "rolled-back"
                : null;
          // #region agent log
          agentDebugLog({
            hypothesisId: recommend === "applied" ? "H2" : recommend === "rolled-back" ? "H3" : "H5",
            location: "migrate.mjs:p3009-probe",
            message: "users-access-key-column",
            data: {
              failedMigration: failedName,
              probeOk: probe.ok,
              accessKeyExists: probe.ok ? probe.exists : null,
              probeError: probe.ok ? undefined : probe.error ?? probe.reason,
              recommend,
            },
          });
          // #endregion

          if (probe.ok) {
            const autoOff =
              String(process.env.PRISMA_MIGRATE_AUTO_RESOLVE_ACCESS_KEY || "").trim() === "0" ||
              String(process.env.PRISMA_MIGRATE_AUTO_RESOLVE_ACCESS_KEY || "").toLowerCase() === "false";
            if (!autoOff) {
              const useApplied = probe.exists === true;
              console.warn(
                `[migrate] P3009 add_access_key: public.users.access_key existe=${probe.exists}; ` +
                  `ejecutando migrate resolve --${useApplied ? "applied" : "rolled-back"} automático. ` +
                  "Desactivar: PRISMA_MIGRATE_AUTO_RESOLVE_ACCESS_KEY=0"
              );
              const { status: rs, combined: rc } = runPrismaMigrateResolve(
                tunedMigrateUrl,
                failedName,
                useApplied
              );
              if (rs === 0) {
                console.warn("[migrate] migrate resolve OK; reintentando migrate deploy (mismo bucle).");
                attempt -= 1;
                continue;
              }
              console.error("[migrate] migrate resolve falló:", rc.slice(0, 900));
            }
            console.error(
              `[migrate] P3009 diagnóstico (runtime): public.users.access_key existe=${probe.exists}. ` +
                (autoOff ? "Auto-resolve desactivado. " : "") +
                (probe.exists
                  ? `Manual: DATABASE_URL=…session:5432… npx prisma migrate resolve --applied "${failedName}"`
                  : `Manual: DATABASE_URL=…session:5432… npx prisma migrate resolve --rolled-back "${failedName}" y redeploy.`)
            );
          } else {
            console.error(
              "[migrate] P3009 add_access_key: no se pudo comprobar information_schema (sin credenciales en log):",
              probe.error || probe.reason || "(sin detalle)"
            );
          }
        } else {
          // #region agent log
          agentDebugLog({
            hypothesisId: "H1",
            location: "migrate.mjs:p3009-skip-probe",
            message: "no-column-probe-for-migration",
            data: { failedMigration: failedName },
          });
          // #endregion
        }
        break;
      }

      if (attempt < maxAttempts) {
        console.warn(
          `[migrate] Reintento en ${delaySec}s. (P1001/db.*: revisá DIRECT; P3009: no se reintenta — ver mensaje arriba.)`
        );
        sleepSyncSeconds(delaySec);
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
})().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
