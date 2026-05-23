import { prisma } from "@/lib/prisma";
import { getGoogleMerchantConfig } from "./config";
import { getGoogleMerchantContentClient } from "./auth";
import {
  mapProductToGoogleContent,
  merchantProductId,
  productInclude,
  type MerchantCatalogProduct,
} from "./product";

const BATCH_SIZE = 200;
const DEFAULT_SYNC_LIMIT = 5000;

export type MerchantSyncEntryResult = {
  batchId: number;
  offerId?: string;
  productId?: string;
  method: string;
  ok: boolean;
  errors?: Array<{ message?: string; reason?: string }>;
};

export type MerchantSyncReport = {
  startedAt: string;
  finishedAt: string;
  merchantId: string;
  insertedOrUpdated: number;
  deleted: number;
  skipped: number;
  failed: number;
  errors: MerchantSyncEntryResult[];
};

type BatchEntry = {
  batchId: number;
  merchantId: string;
  method: "insert" | "delete";
  product?: Record<string, unknown>;
  productId?: string;
};

async function runCustomBatch(
  entries: BatchEntry[]
): Promise<MerchantSyncEntryResult[]> {
  if (entries.length === 0) return [];

  const config = getGoogleMerchantConfig();
  if (!config) throw new Error("Config Merchant incompleta");

  const content = await getGoogleMerchantContentClient();
  const res = await content.products.custombatch({
    requestBody: { entries },
  });

  const out: MerchantSyncEntryResult[] = [];
  for (const entry of res.data.entries ?? []) {
    const batchId = entry.batchId ?? -1;
    const source = entries.find((e) => e.batchId === batchId);
    const errs = entry.errors?.errors?.map((e) => ({
      message: e.message,
      reason: e.reason,
    }));

    out.push({
      batchId,
      offerId:
        source?.method === "insert"
          ? String((source.product as { offerId?: string })?.offerId ?? "")
          : undefined,
      productId: source?.productId,
      method: source?.method ?? "unknown",
      ok: !entry.errors,
      errors: errs?.length ? errs : undefined,
    });
  }
  return out;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export async function syncActiveProductsToMerchant(params?: {
  limit?: number;
}): Promise<MerchantSyncReport> {
  const startedAt = new Date().toISOString();
  const config = getGoogleMerchantConfig();
  if (!config) throw new Error("GOOGLE_MERCHANT_CENTER_ID no configurado");

  const limit = Math.min(params?.limit ?? DEFAULT_SYNC_LIMIT, DEFAULT_SYNC_LIMIT);

  const rows = await prisma.product.findMany({
    where: {
      isActive: true,
      images: { some: {} },
    },
    include: productInclude,
    orderBy: { updatedAt: "desc" },
    take: limit,
  });

  let batchId = 0;
  const allEntries: BatchEntry[] = [];
  let skipped = 0;

  for (const row of rows) {
    const mapped = mapProductToGoogleContent(row as MerchantCatalogProduct, config);
    if (!mapped) {
      skipped += 1;
      continue;
    }
    batchId += 1;
    allEntries.push({
      batchId,
      merchantId: config.merchantId,
      method: "insert",
      product: mapped,
    });
  }

  const errors: MerchantSyncEntryResult[] = [];
  let insertedOrUpdated = 0;
  let failed = 0;

  for (const part of chunk(allEntries, BATCH_SIZE)) {
    const results = await runCustomBatch(part);
    for (const r of results) {
      if (r.ok) insertedOrUpdated += 1;
      else {
        failed += 1;
        if (errors.length < 50) errors.push(r);
      }
    }
  }

  return {
    startedAt,
    finishedAt: new Date().toISOString(),
    merchantId: config.merchantId,
    insertedOrUpdated,
    deleted: 0,
    skipped,
    failed,
    errors,
  };
}

export async function deleteInactiveProductsFromMerchant(params?: {
  limit?: number;
}): Promise<MerchantSyncReport> {
  const startedAt = new Date().toISOString();
  const config = getGoogleMerchantConfig();
  if (!config) throw new Error("GOOGLE_MERCHANT_CENTER_ID no configurado");

  const limit = Math.min(params?.limit ?? 2000, DEFAULT_SYNC_LIMIT);

  const rows = await prisma.product.findMany({
    where: {
      OR: [{ isActive: false }, { stock: { lte: 0 } }],
    },
    select: { id: true },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });

  let batchId = 0;
  const allEntries: BatchEntry[] = rows.map((r) => {
    batchId += 1;
    return {
      batchId,
      merchantId: config.merchantId,
      method: "delete" as const,
      productId: merchantProductId(r.id, config),
    };
  });

  const errors: MerchantSyncEntryResult[] = [];
  let deleted = 0;
  let failed = 0;

  for (const part of chunk(allEntries, BATCH_SIZE)) {
    const results = await runCustomBatch(part);
    for (const r of results) {
      if (r.ok) deleted += 1;
      else {
        failed += 1;
        if (errors.length < 50) errors.push(r);
      }
    }
  }

  return {
    startedAt,
    finishedAt: new Date().toISOString(),
    merchantId: config.merchantId,
    insertedOrUpdated: 0,
    deleted,
    skipped: 0,
    failed,
    errors,
  };
}

export async function fullMerchantCatalogSync(params?: {
  limit?: number;
  purgeInactive?: boolean;
}): Promise<{ upsert: MerchantSyncReport; purge?: MerchantSyncReport }> {
  const upsert = await syncActiveProductsToMerchant({ limit: params?.limit });
  if (!params?.purgeInactive) return { upsert };

  const purge = await deleteInactiveProductsFromMerchant({ limit: params?.limit });
  return { upsert, purge };
}
