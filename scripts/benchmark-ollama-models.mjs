#!/usr/bin/env node
/**
 * Benchmark de latencia Ollama para el bot WhatsApp.
 * Uso: npm run ollama:bench
 * Requiere Ollama corriendo (ollama serve) y modelos ya descargados (ollama pull ...).
 */

const BASE = (process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434").replace(/\/$/, "");

const DEFAULT_MODELS = [
  "qwen2.5:3b",
  "qwen2.5:7b",
  "llama3.2:3b",
  "phi3:mini",
  "gemma2:2b",
  "mistral:7b",
];

const SAMPLE_PROMPT = `Sos asistente de una ferretería en Argentina. Respondé en 2 oraciones.
Cliente: ¿Tenés taladro percutor y cuánto sale el envío a Córdoba?
Vos:`;

function parseModelsArg() {
  const arg = process.argv.find((a) => a.startsWith("--models="));
  if (!arg) return DEFAULT_MODELS;
  return arg
    .slice("--models=".length)
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
}

async function listInstalled() {
  const res = await fetch(`${BASE}/api/tags`);
  if (!res.ok) throw new Error(`tags HTTP ${res.status}`);
  const data = await res.json();
  return new Set((data.models ?? []).map((m) => m.name));
}

async function benchModel(model) {
  const start = performance.now();
  const res = await fetch(`${BASE}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt: SAMPLE_PROMPT,
      stream: false,
      options: { temperature: 0.4, num_predict: 120 },
    }),
  });
  const elapsed = Math.round(performance.now() - start);

  if (!res.ok) {
    return { model, ok: false, ms: elapsed, error: `HTTP ${res.status}` };
  }

  const data = await res.json();
  const chars = (data.response ?? "").length;
  return { model, ok: true, ms: elapsed, chars, evalMs: data.eval_duration ? Math.round(data.eval_duration / 1e6) : null };
}

async function main() {
  const models = parseModelsArg();
  console.log(`Ollama: ${BASE}`);
  console.log(`Modelos a probar: ${models.join(", ")}\n`);

  let installed;
  try {
    installed = await listInstalled();
  } catch (e) {
    console.error("No se pudo conectar a Ollama. ¿Está corriendo? (ollama serve)");
    console.error(e.message);
    process.exit(1);
  }

  const results = [];
  for (const model of models) {
    if (!installed.has(model)) {
      console.log(`⏭  ${model} — no instalado (ollama pull ${model})`);
      results.push({ model, ok: false, skip: true });
      continue;
    }
    process.stdout.write(`… ${model} `);
    const r = await benchModel(model);
    results.push(r);
    if (r.ok) {
      console.log(`✓ ${r.ms} ms (${r.chars} chars)`);
    } else {
      console.log(`✗ ${r.error ?? "fail"} (${r.ms} ms)`);
    }
  }

  const ok = results.filter((r) => r.ok).sort((a, b) => a.ms - b.ms);
  console.log("\n--- Ranking (más rápido primero) ---");
  if (ok.length === 0) {
    console.log("Sin resultados OK. Instalá modelos con: ollama pull qwen2.5:7b");
    process.exit(1);
  }
  ok.forEach((r, i) => {
    console.log(`${i + 1}. ${r.model} — ${r.ms} ms`);
  });
  console.log(`\nRecomendado para dev (.env.local): OLLAMA_MODEL=${ok[0].model}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
