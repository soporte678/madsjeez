/**
 * Sincroniza catálogo activo a Google Merchant Content API.
 * Requiere variables en .env.local y servidor accesible, o ejecutar lógica vía API en prod.
 *
 * Uso local contra prod:
 *   ADMIN_SETUP_SECRET=xxx node scripts/sync-google-merchant.mjs https://www.madsjeez.com.ar
 */
const base = (process.argv[2] || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
  /\/$/,
  ""
);
const secret = process.env.ADMIN_SETUP_SECRET?.trim();
if (!secret) {
  console.error("Falta ADMIN_SETUP_SECRET");
  process.exit(1);
}

const res = await fetch(`${base}/api/internal/google-merchant/sync`, {
  method: "POST",
  headers: { Authorization: `Bearer ${secret}` },
});
const data = await res.json().catch(() => ({}));
console.log(res.status, JSON.stringify(data, null, 2));
process.exit(res.ok ? 0 : 1);
