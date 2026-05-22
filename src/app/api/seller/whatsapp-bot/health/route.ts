import { NextResponse } from "next/server";
import { requireSellerSession } from "@/lib/whatsapp-bot/auth";
import { checkEvolutionApiHealth } from "@/lib/whatsapp-bot/evolution-health";

export async function GET() {
  const auth = await requireSellerSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const evolution = await checkEvolutionApiHealth();
  return NextResponse.json({ evolution });
}
