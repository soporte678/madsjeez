import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

/**
 * Alta / activación de transportista Flash (operaciones).
 * POST con Authorization: Bearer {ADMIN_SETUP_SECRET} o {CRON_SECRET}
 *
 * Body: { email, name?, phone?, vehicleType?, setPassword? }
 * - Si el usuario no existe, `setPassword` (≥8) es obligatorio.
 * - Si existe sin chofer, crea FlashDriver activo.
 * - Si existe con chofer pendiente, lo activa.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.INTERNAL_DRIVER_SECRET?.trim() || process.env.ADMIN_SETUP_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "No configurado" }, { status: 503 });
  }

  const auth = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (auth !== secret) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: {
    email?: string;
    name?: string;
    phone?: string;
    vehicleType?: string;
    setPassword?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "email inválido" }, { status: 400 });
  }

  const phone = (body.phone ?? "0000000000").trim();
  const vehicleType = (body.vehicleType ?? "moto").trim();
  const name = (body.name ?? email.split("@")[0]).trim();

  let user = await prisma.user.findUnique({ where: { email } });
  let userCreated = false;
  let passwordSet = false;

  if (!user) {
    const pwd = body.setPassword?.trim();
    if (!pwd || pwd.length < 8) {
      return NextResponse.json(
        {
          error: "Usuario inexistente: enviá setPassword (mín. 8 caracteres) para crear la cuenta.",
        },
        { status: 400 }
      );
    }
    user = await prisma.user.create({
      data: {
        name,
        email,
        password: await bcrypt.hash(pwd, 12),
        role: "USER",
        isSeller: false,
        subscriptionTier: "FREE",
        reputationColor: "VERDE",
      },
    });
    userCreated = true;
    passwordSet = true;
  } else if (body.setPassword?.trim()) {
    const pwd = body.setPassword.trim();
    if (pwd.length < 8) {
      return NextResponse.json({ error: "setPassword debe tener al menos 8 caracteres" }, { status: 400 });
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { password: await bcrypt.hash(pwd, 12) },
    });
    passwordSet = true;
  }

  const existingDriver = await prisma.flashDriver.findUnique({
    where: { userId: user.id },
  });

  let driver;
  if (existingDriver) {
    driver = await prisma.flashDriver.update({
      where: { id: existingDriver.id },
      data: { isActive: true, phone, vehicleType },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  } else {
    driver = await prisma.flashDriver.create({
      data: {
        userId: user.id,
        phone,
        vehicleType,
        isActive: true,
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  return NextResponse.json({
    ok: true,
    email,
    userCreated,
    passwordSet,
    driverActive: driver.isActive,
    driverId: driver.id,
    userId: user.id,
    loginUrl: "https://www.madsjeez.com.ar/driver/login",
    note: "Si ya tenía sesión abierta, cerrá sesión y volvé a ingresar para actualizar permisos Flash.",
  });
}
