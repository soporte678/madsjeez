#!/usr/bin/env node
/**
 * audit-private-coordinates.mjs  (FASE 20)
 *
 * Verifica que las coordenadas PRIVADAS de vendedores no se filtren al cliente:
 *   1. La vista public_seller_locations NO debe contener latitude/longitude privadas.
 *   2. La RPC nearby_sellers solo devuelve coords públicas.
 *   3. (opcional, --html <url>) Descarga una página pública y chequea que no
 *      aparezcan coordenadas privadas en el HTML.
 *
 * Uso:
 *   SUPABASE_SERVICE_ROLE_KEY=... node scripts/audit-private-coordinates.mjs
 *   ... node scripts/audit-private-coordinates.mjs --html https://www.madsjeez.com.ar/seller/<id>
 */

import { createClient } from "@supabase/supabase-js";

const URL = process.env.SUPABASE_URL || "https://doweovsukuskflgnxhhn.supabase.co";
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) {
  console.error("Falta SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const sb = createClient(URL, KEY);

let failures = 0;
function check(name, ok, detail = "") {
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? " — " + detail : ""}`);
  if (!ok) failures++;
}

async function main() {
  // 1. La vista no debe tener columnas privadas
  const { data: viewRows, error } = await sb.from("public_seller_locations").select("*").limit(1);
  if (error) {
    check("vista public_seller_locations accesible", false, error.message);
  } else {
    const cols = viewRows && viewRows[0] ? Object.keys(viewRows[0]) : [];
    const leak = cols.filter((c) => c === "latitude" || c === "longitude" || c === "location");
    check("vista pública sin columnas privadas (latitude/longitude/location)", leak.length === 0, leak.join(","));
  }

  // 2. RPC nearby_sellers no expone privadas (chequeo estructural)
  const { data: near, error: e2 } = await sb.rpc("nearby_sellers", {
    buyer_lat: -34.6, buyer_lng: -58.4, radius_km: 50, p_limit: 1, p_offset: 0,
  });
  if (e2) {
    check("RPC nearby_sellers ejecutable", false, e2.message);
  } else {
    const cols = near && near[0] ? Object.keys(near[0]) : [];
    const leak = cols.filter((c) => c === "latitude" || c === "longitude");
    check("nearby_sellers sin lat/lng privadas (solo public_*)", leak.length === 0, leak.join(","));
  }

  // 3. (opcional) HTML público
  const htmlIdx = process.argv.indexOf("--html");
  if (htmlIdx >= 0 && process.argv[htmlIdx + 1]) {
    const url = process.argv[htmlIdx + 1];
    const { data: locs } = await sb
      .from("seller_locations")
      .select("latitude, longitude")
      .not("latitude", "is", null)
      .limit(500);
    const res = await fetch(url);
    const html = await res.text();
    let found = 0;
    for (const l of locs || []) {
      const latStr = String(l.latitude).slice(0, 8);
      const lngStr = String(l.longitude).slice(0, 8);
      if (html.includes(latStr) && html.includes(lngStr)) found++;
    }
    check(`HTML ${url} sin coords privadas`, found === 0, found ? `${found} coincidencias` : "");
  }

  console.log(`\n${failures === 0 ? "OK" : "FALLOS: " + failures}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("ERROR:", e.message || e);
  process.exit(1);
});
