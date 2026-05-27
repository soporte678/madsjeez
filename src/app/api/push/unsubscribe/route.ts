import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { endpoint } = await req.json();
    await prisma.pushSubscription.deleteMany({ where: { endpoint } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Error al desuscribir" }, { status: 500 });
  }
}
