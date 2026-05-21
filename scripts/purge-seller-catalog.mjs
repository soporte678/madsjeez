/**
 * Vacía catálogo de un vendedor por email (API interna en prod).
 *
 *   set ADMIN_SETUP_SECRET=tu_secreto
 *   node scripts/purge-seller-catalog.mjs vianferreteria@gmail.com
 *   node scripts/purge-seller-catalog.mjs vianferreteria@gmail.com https://www.madsjeez.com.ar
 */
const email = (process.argv[2] || "").trim();
const base = (process.argv[3] || process.env.NEXT_PUBLIC_APP_URL || "https://www.madsjeez.com.ar").replace(
  /\/$/,
  ""
);
const secret = process.env.ADMIN_SETUP_SECRET?.trim();

if (!email) {
  console.error("Uso: node scripts/purge-seller-catalog.mjs <email> [baseUrl]");
  process.exit(1);
}
if (!secret) {
  console.error("Falta ADMIN_SETUP_SECRET en el entorno");
  process.exit(1);
}

const res = await fetch(`${base}/api/internal/sellers/purge-catalog`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${secret}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ email, mode: "delete" }),
});

const data = await res.json().catch(() => ({}));
console.log(res.status, JSON.stringify(data, null, 2));
process.exit(res.ok ? 0 : 1);
