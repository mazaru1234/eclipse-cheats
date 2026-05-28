import { db } from "@/lib/db";
import { licenseKeys, products, categories, productLines } from "@/lib/db/schema";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import { decryptAES256 } from "@/lib/crypto";
import { formatDurationLabel } from "@/lib/product-utils";

export interface KeyListRow {
  id: string;
  value: string;
  status: string;
  productId: string;
  productName: string;
  gameName: string;
  lineName: string | null;
  durationDays: number;
  orderId: string | null;
  createdAt: Date;
  soldAt: Date | null;
}

export interface KeyStats {
  available: number;
  reserved: number;
  sold: number;
  expired: number;
  total: number;
}

export async function getKeyStats(): Promise<KeyStats> {
  const rows = await db
    .select({
      status: licenseKeys.status,
      count: sql<number>`count(*)`,
    })
    .from(licenseKeys)
    .groupBy(licenseKeys.status);

  const map = new Map(rows.map((row) => [row.status, row.count ?? 0]));

  return {
    available: map.get("available") ?? 0,
    reserved: map.get("reserved") ?? 0,
    sold: map.get("sold") ?? 0,
    expired: 0,
    total: rows.reduce((sum, row) => sum + (row.count ?? 0), 0),
  };
}

export async function listAdminKeys(params: {
  productId?: string;
  lineId?: string;
  status?: string;
  search?: string;
  sort?: "newest" | "oldest" | "status";
  limit?: number;
  offset?: number;
}) {
  const limit = params.limit ?? 20;
  const offset = params.offset ?? 0;

  const conditions = [];

  if (params.productId) {
    conditions.push(eq(licenseKeys.productId, params.productId));
  }

  if (params.lineId) {
    conditions.push(eq(products.lineId, params.lineId));
  }

  if (params.status) {
    conditions.push(eq(licenseKeys.status, params.status as "available" | "reserved" | "sold"));
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;

  const orderBy =
    params.sort === "oldest"
      ? asc(licenseKeys.createdAt)
      : params.sort === "status"
        ? asc(licenseKeys.status)
        : desc(licenseKeys.createdAt);

  const rows = await db
    .select({
      key: licenseKeys,
      product: products,
      game: categories,
      line: productLines,
    })
    .from(licenseKeys)
    .innerJoin(products, eq(licenseKeys.productId, products.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(productLines, eq(products.lineId, productLines.id))
    .where(whereClause)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

  let mapped: KeyListRow[] = rows.map((row) => ({
    id: row.key.id,
    value: decryptAES256(row.key.encryptedKey),
    status: row.key.status,
    productId: row.product.id,
    productName: formatDurationLabel(row.product.durationDays),
    gameName: row.game.name,
    lineName: row.line?.name ?? row.product.name,
    durationDays: row.product.durationDays,
    orderId: row.key.orderId,
    createdAt: row.key.createdAt,
    soldAt: row.key.soldAt,
  }));

  if (params.search?.trim()) {
    const q = params.search.trim().toLowerCase();
    mapped = mapped.filter(
      (row) =>
        row.value.toLowerCase().includes(q) ||
        row.gameName.toLowerCase().includes(q) ||
        (row.lineName ?? "").toLowerCase().includes(q) ||
        row.id.toLowerCase().includes(q)
    );
  }

  const [totalRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(licenseKeys)
    .innerJoin(products, eq(licenseKeys.productId, products.id))
    .where(whereClause);

  return {
    rows: mapped,
    total: totalRow?.count ?? mapped.length,
  };
}

export async function getProductsForKeyImport() {
  const rows = await db
    .select({
      id: products.id,
      durationDays: products.durationDays,
      gameName: categories.name,
      lineName: productLines.name,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(productLines, eq(products.lineId, productLines.id))
    .where(eq(products.isActive, true))
    .orderBy(asc(categories.name), asc(productLines.name), asc(products.durationDays));

  return rows.map((row) => ({
    id: row.id,
    label: `${row.gameName} / ${row.lineName ?? "Товар"} / ${formatDurationLabel(row.durationDays)}`,
  }));
}

export interface KeyImportTier {
  id: string;
  durationDays: number;
  durationLabel: string;
  price: number;
  stockCount: number;
}

export interface KeyImportLine {
  id: string;
  name: string;
  slug: string;
  gameId: string;
  gameName: string;
  gameSlug: string;
  imageUrl: string | null;
  tiers: KeyImportTier[];
}

export async function getProductLinesForKeyImport(): Promise<KeyImportLine[]> {
  const lines = await db
    .select({
      id: productLines.id,
      name: productLines.name,
      slug: productLines.slug,
      imageUrl: productLines.imageUrl,
      gameId: categories.id,
      gameName: categories.name,
      gameSlug: categories.slug,
    })
    .from(productLines)
    .innerJoin(categories, eq(productLines.categoryId, categories.id))
    .where(and(eq(productLines.isActive, true), eq(categories.isActive, true)))
    .orderBy(asc(categories.name), asc(productLines.name));

  const tiers = await db
    .select({
      id: products.id,
      lineId: products.lineId,
      durationDays: products.durationDays,
      price: products.price,
      stockCount: products.stockCount,
    })
    .from(products)
    .innerJoin(productLines, eq(products.lineId, productLines.id))
    .where(and(eq(products.isActive, true), eq(productLines.isActive, true)))
    .orderBy(asc(products.durationDays));

  const tiersByLine = new Map<string, KeyImportTier[]>();
  for (const tier of tiers) {
    if (!tier.lineId) continue;
    const list = tiersByLine.get(tier.lineId) ?? [];
    list.push({
      id: tier.id,
      durationDays: tier.durationDays,
      durationLabel: formatDurationLabel(tier.durationDays),
      price: tier.price,
      stockCount: tier.stockCount,
    });
    tiersByLine.set(tier.lineId, list);
  }

  return lines
    .map((line) => ({
      ...line,
      tiers: tiersByLine.get(line.id) ?? [],
    }))
    .filter((line) => line.tiers.length > 0);
}
