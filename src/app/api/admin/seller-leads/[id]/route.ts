import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const validStatuses = new Set(["NEW", "CONTACTED", "ACTIVATED", "SELLING"]);

async function assertAdmin(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user?.id) return false;

  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("is_active")
    .eq("user_id", session.user.id)
    .eq("is_active", true)
    .single();

  return Boolean(adminUser);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await assertAdmin(request))) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { status?: string };
  const status = body.status?.trim().toUpperCase();
  if (!status || !validStatuses.has(status)) return NextResponse.json({ error: "Estado invalido" }, { status: 400 });

  const lead = await prisma.sellerLead.update({
    where: { id },
    data: { status: status as "NEW" | "CONTACTED" | "ACTIVATED" | "SELLING" },
  });

  return NextResponse.json({ lead });
}
