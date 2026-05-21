import { prisma } from "@/lib/prisma";
import { supabaseService } from "@/lib/supabase/service";

export type SellerCatalogPurgeMode = "deactivate" | "delete";

export type SellerCatalogPurgeReport = {
  email: string;
  sellerId: string | null;
  mode: SellerCatalogPurgeMode;
  postgres: {
    totalBefore: number;
    deleted: number;
    deactivated: number;
    activeAfter: number;
    totalAfter: number;
    withOrders: number;
  };
  supabase: {
    deleted: number;
    errors: string[];
  };
};

async function purgeSupabaseProductsBySellerIds(sellerIds: string[]): Promise<{
  deleted: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let deleted = 0;
  const ids = [...new Set(sellerIds.filter(Boolean))];

  for (const sellerId of ids) {
    const { data, error } = await supabaseService
      .from("products")
      .select("id")
      .eq("seller_id", sellerId);

    if (error) {
      errors.push(`list ${sellerId}: ${error.message}`);
      continue;
    }

    for (const row of data ?? []) {
      await supabaseService.from("product_images").delete().eq("product_id", row.id);
      await supabaseService.from("product_attributes").delete().eq("product_id", row.id);
      const { error: delErr } = await supabaseService
        .from("products")
        .delete()
        .eq("id", row.id);
      if (delErr) errors.push(`delete ${row.id}: ${delErr.message}`);
      else deleted += 1;
    }
  }

  return { deleted, errors };
}

export async function purgeSellerCatalogByEmail(
  email: string,
  mode: SellerCatalogPurgeMode = "delete"
): Promise<SellerCatalogPurgeReport> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    throw new Error("Email requerido");
  }

  const seller = await prisma.user.findFirst({
    where: { email: { equals: normalized, mode: "insensitive" } },
    select: { id: true, email: true },
  });

  if (!seller) {
    return {
      email: normalized,
      sellerId: null,
      mode,
      postgres: {
        totalBefore: 0,
        deleted: 0,
        deactivated: 0,
        activeAfter: 0,
        totalAfter: 0,
        withOrders: 0,
      },
      supabase: { deleted: 0, errors: ["Usuario no encontrado en Postgres"] },
    };
  }

  const totalBefore = await prisma.product.count({
    where: { sellerId: seller.id },
  });

  const withOrdersRows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT DISTINCT oi.product_id AS id
    FROM order_items oi
    INNER JOIN products p ON p.id = oi.product_id
    WHERE p.seller_id = ${seller.id}
  `;
  const withOrdersIds = withOrdersRows.map((r) => r.id);
  const withOrders = withOrdersIds.length;

  let deleted = 0;
  let deactivated = 0;

  if (mode === "delete") {
    const del = await prisma.product.deleteMany({
      where: {
        sellerId: seller.id,
        ...(withOrdersIds.length > 0 ? { id: { notIn: withOrdersIds } } : {}),
      },
    });
    deleted = del.count;

    if (withOrdersIds.length > 0) {
      const off = await prisma.product.updateMany({
        where: { sellerId: seller.id, isActive: true },
        data: { isActive: false },
      });
      deactivated = off.count;
    }
  } else {
    const off = await prisma.product.updateMany({
      where: { sellerId: seller.id, isActive: true },
      data: { isActive: false },
    });
    deactivated = off.count;
  }

  const { data: profile } = await supabaseService
    .from("profiles")
    .select("id")
    .eq("email", normalized)
    .maybeSingle();

  const supabase = await purgeSupabaseProductsBySellerIds([
    seller.id,
    profile?.id ?? "",
  ]);

  const activeAfter = await prisma.product.count({
    where: { sellerId: seller.id, isActive: true },
  });
  const totalAfter = await prisma.product.count({
    where: { sellerId: seller.id },
  });

  return {
    email: seller.email,
    sellerId: seller.id,
    mode,
    postgres: {
      totalBefore,
      deleted,
      deactivated,
      activeAfter,
      totalAfter,
      withOrders,
    },
    supabase,
  };
}
