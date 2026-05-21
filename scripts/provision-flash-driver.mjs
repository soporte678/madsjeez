/**
 * Activa transportista Flash por email.
 * Uso: node scripts/provision-flash-driver.mjs infomaqjeez@gmail.com [password-opcional]
 */
import { config } from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const root = process.cwd();
if (existsSync(resolve(root, ".env.local"))) config({ path: resolve(root, ".env.local") });
else if (existsSync(resolve(root, ".env"))) config({ path: resolve(root, ".env") });

const email = process.argv[2]?.trim().toLowerCase();
const setPassword = process.argv[3]?.trim();

if (!email) {
  console.error("Uso: node scripts/provision-flash-driver.mjs <email> [password]");
  process.exit(1);
}

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error("DATABASE_URL no configurada");
  process.exit(1);
}

const pool = new Pool({ connectionString: url });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    if (!setPassword || setPassword.length < 8) {
      console.error("Usuario no existe. Pasá password como 2do argumento (mín. 8).");
      process.exit(1);
    }
    user = await prisma.user.create({
      data: {
        name: email.split("@")[0],
        email,
        password: await bcrypt.hash(setPassword, 12),
        role: "USER",
        isSeller: false,
        subscriptionTier: "FREE",
        reputationColor: "VERDE",
      },
    });
    console.log("Usuario creado:", user.id);
  } else if (setPassword) {
    await prisma.user.update({
      where: { id: user.id },
      data: { password: await bcrypt.hash(setPassword, 12) },
    });
    console.log("Contraseña actualizada");
  }

  const existing = await prisma.flashDriver.findUnique({ where: { userId: user.id } });
  if (existing) {
    await prisma.flashDriver.update({
      where: { id: existing.id },
      data: { isActive: true, phone: existing.phone || "0000000000" },
    });
    console.log("FlashDriver activado:", existing.id);
  } else {
    const d = await prisma.flashDriver.create({
      data: { userId: user.id, phone: "0000000000", vehicleType: "moto", isActive: true },
    });
    console.log("FlashDriver creado:", d.id);
  }
  console.log("Login: https://www.madsjeez.com.ar/driver/login");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
