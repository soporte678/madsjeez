import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

/**
 * GET /api/user/access-key/status
 * Devuelve si el usuario tiene una clave de acceso configurada
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { accessKey: true },
    });

    return NextResponse.json({
      hasAccessKey: !!user?.accessKey,
    });
  } catch (error) {
    console.error("Error checking access key status:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/**
 * POST /api/user/access-key
 * Crea o actualiza la clave de acceso del usuario
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { accessKey, confirmAccessKey } = await req.json();

    if (!accessKey || !confirmAccessKey) {
      return NextResponse.json(
        { error: "Ambos campos son requeridos" },
        { status: 400 }
      );
    }

    if (accessKey !== confirmAccessKey) {
      return NextResponse.json(
        { error: "Las claves no coinciden" },
        { status: 400 }
      );
    }

    if (accessKey.length < 4 || accessKey.length > 6) {
      return NextResponse.json(
        { error: "La clave debe tener entre 4 y 6 caracteres" },
        { status: 400 }
      );
    }

    const hashedKey = await bcrypt.hash(accessKey, 10);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { accessKey: hashedKey },
    });

    return NextResponse.json({ success: true, message: "Clave de acceso guardada" });
  } catch (error) {
    console.error("Error saving access key:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/**
 * DELETE /api/user/access-key
 * Elimina la clave de acceso del usuario (requiere verificación)
 */
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { accessKey } = await req.json();

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { accessKey: true },
    });

    if (!user?.accessKey) {
      return NextResponse.json(
        { error: "No tienes una clave de acceso configurada" },
        { status: 400 }
      );
    }

    const isValid = await bcrypt.compare(accessKey, user.accessKey);
    if (!isValid) {
      return NextResponse.json(
        { error: "Clave de acceso incorrecta" },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { accessKey: null },
    });

    return NextResponse.json({ success: true, message: "Clave de acceso eliminada" });
  } catch (error) {
    console.error("Error deleting access key:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
