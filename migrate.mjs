/**
 * Ejecuta `prisma migrate deploy` usando DATABASE_URL desde el entorno.
 * No incluir contraseñas en este archivo.
 *
 * Uso local: DATABASE_URL en .env.local o exportada en la shell.
 * CI/Railway: variable DATABASE_URL configurada en el servicio.
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

const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;

const looksLikePgPooler =
  DATABASE_URL &&
  (DATABASE_URL.includes(":6543") ||
    DATABASE_URL.includes(".pooler.supabase.com"));

if (looksLikePgPooler && !process.env.PRISMA_MIGRATE_POOLER_OK) {
  console.warn(
    "[migrate] DATABASE_URL parece ser el pooler de Supabase (:6543 / pooler.*). " +
      "`prisma migrate deploy` suele necesitar la URL directa (:5432). " +
      "Exportá PRISMA_MIGRATE_POOLER_OK=1 para silenciar este aviso."
  );
}

if (!DATABASE_URL) {
  console.error(
    "Falta DATABASE_URL (o SUPABASE_DATABASE_URL). Configúrala en .env.local o en variables del CI/hosting."
  );
  process.exit(1);
}

try {
  console.log("Ejecutando migraciones...");
  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL },
    stdio: "inherit",
    cwd: process.cwd(),
  });
} catch (error) {
  console.error("Error:", error);
  process.exit(1);
}
