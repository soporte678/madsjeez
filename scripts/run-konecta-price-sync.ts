/**
 * Ejecuta sync de precios Konecta (usa Prisma + DATABASE_URL).
 * En CI: workflow konecta-price-sync.yml
 */
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { syncKonectaPrices } from "../src/lib/konecta/sync-prices";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("Falta DATABASE_URL");
    process.exit(1);
  }

  const dryRun =
    process.env.KONECTA_DRY_RUN === "true" ||
    process.argv.includes("--dry-run");

  console.log("Iniciando sync Konecta...", dryRun ? "(dry-run)" : "(REAL)");

  const result = await syncKonectaPrices({ dryRun });

  const reportPath = path.join(process.cwd(), "scripts", "konecta-price-update-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));

  console.log("Catálogo:", result.catalogItems);
  console.log("Productos vendedor:", result.productsTotal);
  console.log("Actualizados:", result.updated);
  console.log("Sin match:", result.skipped);
  console.log("Reporte:", reportPath);

  if (result.skipped > 0) {
    console.log("Primeros sin match:", result.unmatched.slice(0, 5));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
