#!/usr/bin/env node
/**
 * update-ollama-tunnel.mjs
 *
 * Lee la URL pública activa de ngrok y la actualiza en:
 *   1. .env.local (para dev local)
 *   2. Railway (vía CLI) — requiere: npm i -g @railway/cli + railway login
 *
 * Uso:
 *   node scripts/update-ollama-tunnel.mjs
 *   node scripts/update-ollama-tunnel.mjs --watch   (re-chequea cada 30s)
 */

import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const ENV_LOCAL = join(ROOT, ".env.local");
const WATCH = process.argv.includes("--watch");
const NGROK_API = "http://localhost:4040/api/tunnels";
const OLLAMA_MODEL = "closer-ventas-14b";

/** Si tenés dominio ngrok reservado (plan paid), definilo acá o en .env.local */
function getStaticNgrokUrl() {
  const raw =
    process.env.NGROK_STATIC_DOMAIN?.trim() ||
    process.env.OLLAMA_PUBLIC_URL?.trim() ||
    "";
  if (!raw) return null;
  return raw.startsWith("http") ? raw.replace(/\/$/, "") : `https://${raw}`;
}

async function getNgrokUrl() {
  const staticUrl = getStaticNgrokUrl();
  if (staticUrl) return staticUrl;

  try {
    const res = await fetch(NGROK_API);
    if (!res.ok) throw new Error(`ngrok API: ${res.status}`);
    const data = await res.json();
    const tunnel = data.tunnels?.find(
      (t) => t.proto === "https" && t.config?.addr?.includes("11434")
    ) ?? data.tunnels?.[0];
    return tunnel?.public_url ?? null;
  } catch {
    return null;
  }
}

function updateEnvLocal(url) {
  let content = readFileSync(ENV_LOCAL, "utf-8");
  // Update OLLAMA_BASE_URL line
  content = content.replace(
    /^OLLAMA_BASE_URL=.*/m,
    `OLLAMA_BASE_URL=${url}`
  );
  // Update OLLAMA_MODEL line
  content = content.replace(
    /^OLLAMA_MODEL=.*/m,
    `OLLAMA_MODEL=${OLLAMA_MODEL}`
  );
  writeFileSync(ENV_LOCAL, content, "utf-8");
  console.log(`✅ .env.local actualizado → OLLAMA_BASE_URL=${url}`);
}

function updateRailway(url) {
  try {
    // Check if railway CLI is available
    execSync("railway --version", { stdio: "ignore" });
  } catch {
    console.log("⚠️  Railway CLI no instalado. Saltando actualización Railway.");
    console.log("   Instalá con: npm i -g @railway/cli");
    console.log(`   Luego seteá manualmente: OLLAMA_BASE_URL=${url}`);
    return false;
  }

  try {
    execSync(
      `railway variables set OLLAMA_BASE_URL="${url}" OLLAMA_MODEL="${OLLAMA_MODEL}" WHATSAPP_AI_PROVIDER="ollama"`,
      { cwd: ROOT, stdio: "inherit" }
    );
    console.log("✅ Railway actualizado con nueva URL de ngrok");
    return true;
  } catch (e) {
    console.error("❌ Error actualizando Railway:", e.message);
    console.log(`   Seteá manualmente en Railway: OLLAMA_BASE_URL=${url}`);
    return false;
  }
}

async function run() {
  const staticUrl = getStaticNgrokUrl();
  if (staticUrl) {
    console.log(`📌 Usando URL fija (NGROK_STATIC_DOMAIN): ${staticUrl}`);
    await verifyAndUpdate(staticUrl);
    return;
  }

  console.log("🔍 Buscando túnel ngrok activo en :4040...");
  const url = await getNgrokUrl();

  if (!url) {
    console.error("❌ ngrok no está corriendo o no hay túnel en :11434");
    console.error("   Opciones:");
    console.error("   1) ngrok http 11434  (URL cambia cada reinicio)");
    console.error("   2) Dominio fijo: NGROK_STATIC_DOMAIN=https://tu-dominio.ngrok-free.app");
    console.error("   3) Sin ngrok: Ollama en Railway — ver docs/ollama-url-fija-produccion.md");
    process.exit(1);
  }

  await verifyAndUpdate(url);
}

async function verifyAndUpdate(url) {
  console.log(`🌐 URL Ollama pública: ${url}`);
  try {
    console.log("🔬 Verificando que Ollama responde...");
    const res = await fetch(`${url}/api/tags`, {
      headers: { "ngrok-skip-browser-warning": "true" },
      signal: AbortSignal.timeout(10_000),
    });
    if (res.ok) {
      const data = await res.json();
      const models = (data.models ?? []).map((m) => m.name);
      console.log(`✅ Ollama accesible. Modelos: ${models.join(", ")}`);

      const hasModel = models.some((m) => m.includes("closer-ventas-14b"));
      if (!hasModel) {
        console.warn(
          `⚠️  Modelo "closer-ventas-14b" no encontrado. Modelos: ${models.join(", ")}`
        );
      }
    } else {
      console.warn(`⚠️  Ollama respondió HTTP ${res.status}`);
    }
  } catch (e) {
    console.warn(`⚠️  No se pudo verificar Ollama: ${e.message}`);
  }

  updateEnvLocal(url);
  updateRailway(url);

  console.log("\n📋 Variables Railway (si el CLI falla):");
  console.log(`   OLLAMA_BASE_URL = ${url}`);
  console.log(`   OLLAMA_MODEL    = ${OLLAMA_MODEL}`);
  console.log(`   WHATSAPP_AI_PROVIDER = ollama`);
}

async function watchLoop() {
  let lastUrl = null;
  console.log("👀 Modo watch activo — chequeando ngrok cada 30 segundos...\n");

  while (true) {
    const url = await getNgrokUrl();
    if (url && url !== lastUrl) {
      console.log(`\n🔄 URL cambió: ${lastUrl ?? "ninguna"} → ${url}`);
      updateEnvLocal(url);
      updateRailway(url);
      lastUrl = url;
    } else if (!url) {
      console.log(`[${new Date().toLocaleTimeString()}] ngrok no activo — esperando...`);
    } else {
      console.log(`[${new Date().toLocaleTimeString()}] URL sin cambios: ${url}`);
    }
    await new Promise((r) => setTimeout(r, 30_000));
  }
}

if (WATCH) {
  watchLoop().catch(console.error);
} else {
  run().catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  });
}
