import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { categories, productLines, products, licenseKeys } from "@/lib/db/schema";
import { eq, asc, desc, sql, and, like, or, ne } from "drizzle-orm";
import { slugify } from "@/lib/utils";
import { formatDurationLabel, normalizeExternalUrl } from "@/lib/product-utils";
import type { ProductStatus } from "@/lib/product-status";

export async function getAdminCategories(includeInactive = true) {
  const rows = await db
    .select({
      category: categories,
      productCount: sql<number>`count(distinct ${productLines.id})`,
    })
    .from(categories)
    .leftJoin(productLines, eq(productLines.categoryId, categories.id))
    .groupBy(categories.id)
    .orderBy(asc(categories.sortOrder), asc(categories.name));

  return rows
    .map((row) => ({
      ...row.category,
      productCount: row.productCount ?? 0,
    }))
    .filter((row) => includeInactive || row.isActive);
}

export async function getAdminCategory(id: string) {
  const [category] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return category ?? null;
}

export async function createAdminCategory(data: {
  name: string;
  slug?: string;
  description?: string | null;
  imageUrl?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}) {
  const id = nanoid();
  const slug = data.slug?.trim() || slugify(data.name);

  await db.insert(categories).values({
    id,
    name: data.name.trim(),
    slug,
    description: data.description ?? null,
    imageUrl: data.imageUrl ?? null,
    sortOrder: data.sortOrder ?? 0,
    isActive: data.isActive ?? true,
  });

  return { id, slug };
}

export async function updateAdminCategory(
  id: string,
  data: Partial<{
    name: string;
    slug: string;
    description: string | null;
    imageUrl: string | null;
    sortOrder: number;
    isActive: boolean;
  }>
) {
  await db
    .update(categories)
    .set({
      ...data,
      name: data.name?.trim(),
      slug: data.slug?.trim(),
    })
    .where(eq(categories.id, id));
}

export async function deleteAdminCategory(id: string) {
  const [count] = await db
    .select({ count: sql<number>`count(*)` })
    .from(productLines)
    .where(eq(productLines.categoryId, id));

  if ((count?.count ?? 0) > 0) {
    throw new Error("Нельзя удалить категорию с товарами");
  }

  await db.delete(categories).where(eq(categories.id, id));
}

export async function listAdminProductLines(params: {
  categoryId?: string;
  search?: string;
  sort?: "newest" | "oldest" | "name" | "price_asc" | "price_desc";
  limit?: number;
  includeInactive?: boolean;
}) {
  const limit = params.limit ?? 50;
  const conditions = [];

  if (params.categoryId) conditions.push(eq(productLines.categoryId, params.categoryId));
  if (!params.includeInactive) conditions.push(eq(productLines.isActive, true));

  if (params.search?.trim()) {
    const q = `%${params.search.trim()}%`;
    conditions.push(or(like(productLines.name, q), like(productLines.slug, q)));
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;
  const orderBy =
    params.sort === "oldest"
      ? asc(productLines.createdAt)
      : params.sort === "name"
        ? asc(productLines.name)
        : desc(productLines.createdAt);

  const rows = await db
    .select({
      line: productLines,
      categoryName: categories.name,
      categorySlug: categories.slug,
      tierCount: sql<number>`count(${products.id})`,
      minPrice: sql<number>`min(${products.price})`,
      availableKeys: sql<number>`sum(case when ${products.stockCount} > 0 then 1 else 0 end)`,
    })
    .from(productLines)
    .innerJoin(categories, eq(productLines.categoryId, categories.id))
    .leftJoin(products, eq(products.lineId, productLines.id))
    .where(whereClause)
    .groupBy(productLines.id)
    .orderBy(orderBy)
    .limit(limit);

  let mapped = rows.map((row) => ({
    ...row.line,
    categoryName: row.categoryName,
    categorySlug: row.categorySlug,
    tierCount: row.tierCount ?? 0,
    minPrice: row.minPrice ?? 0,
    availableKeys: row.availableKeys ?? 0,
  }));

  if (params.sort === "price_asc") mapped = [...mapped].sort((a, b) => a.minPrice - b.minPrice);
  if (params.sort === "price_desc") mapped = [...mapped].sort((a, b) => b.minPrice - a.minPrice);

  const [totalRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(productLines)
    .where(whereClause);

  return { rows: mapped, total: totalRow?.count ?? mapped.length };
}

export async function getAdminProductLine(id: string) {
  const [row] = await db
    .select({
      line: productLines,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(productLines)
    .innerJoin(categories, eq(productLines.categoryId, categories.id))
    .where(eq(productLines.id, id))
    .limit(1);

  return row ? { ...row.line, categoryName: row.categoryName, categorySlug: row.categorySlug } : null;
}

export async function createAdminProductLine(data: {
  categoryId: string;
  name: string;
  slug?: string;
  description?: string | null;
  longDescription?: string | null;
  imageUrl?: string | null;
  galleryUrls?: string | null;
  features?: string | null;
  systemRequirements?: string | null;
  safetyRating?: number;
  functionalityRating?: number;
  status?: ProductStatus;
  needsUsb?: boolean;
  hasSpoofer?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}) {
  const id = nanoid();
  const slug = data.slug?.trim() || slugify(data.name);

  await db.insert(productLines).values({
    id,
    categoryId: data.categoryId,
    name: data.name.trim(),
    slug,
    description: data.description ?? null,
    longDescription: data.longDescription ?? null,
    imageUrl: data.imageUrl ?? null,
    galleryUrls: data.galleryUrls ?? null,
    features: data.features ?? null,
    systemRequirements: data.systemRequirements ?? null,
    safetyRating: data.safetyRating ?? 5,
    functionalityRating: data.functionalityRating ?? 5,
    status: data.status ?? "on_update",
    needsUsb: data.needsUsb ?? false,
    hasSpoofer: data.hasSpoofer ?? false,
    isActive: data.isActive ?? true,
    sortOrder: data.sortOrder ?? 0,
  });

  return { id, slug };
}

export async function updateAdminProductLine(
  id: string,
  data: Partial<{
    categoryId: string;
    name: string;
    slug: string;
    description: string | null;
    longDescription: string | null;
    imageUrl: string | null;
    galleryUrls: string | null;
    features: string | null;
    systemRequirements: string | null;
    safetyRating: number;
    functionalityRating: number;
    status: ProductStatus;
    needsUsb: boolean;
    hasSpoofer: boolean;
    isActive: boolean;
    sortOrder: number;
  }>
) {
  await db
    .update(productLines)
    .set({
      ...data,
      name: data.name?.trim(),
      slug: data.slug?.trim(),
    })
    .where(eq(productLines.id, id));
}

export async function deleteAdminProductLine(id: string) {
  await db.delete(productLines).where(eq(productLines.id, id));
}

export async function listAdminTiers(lineId: string) {
  return db
    .select()
    .from(products)
    .where(eq(products.lineId, lineId))
    .orderBy(asc(products.durationDays));
}

export async function createAdminTier(data: {
  lineId: string;
  categoryId: string;
  categorySlug: string;
  lineSlug: string;
  price: number;
  durationDays: number;
  name?: string;
  externalUrl?: string | null;
}) {
  const [existing] = await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.lineId, data.lineId), eq(products.durationDays, data.durationDays)))
    .limit(1);

  if (existing) {
    throw new Error(`Тариф на ${formatDurationLabel(data.durationDays)} уже существует`);
  }

  const id = nanoid();
  const name = data.name?.trim() || formatDurationLabel(data.durationDays);
  const slug = `${data.categorySlug}-${data.lineSlug}-${data.durationDays}d`;
  const externalUrl = data.externalUrl !== undefined ? normalizeExternalUrl(data.externalUrl) : null;

  try {
    await db.insert(products).values({
      id,
      categoryId: data.categoryId,
      lineId: data.lineId,
      name,
      slug,
      description: name,
      price: data.price,
      durationDays: data.durationDays,
      externalUrl,
      isActive: true,
      stockCount: 0,
    });
  } catch (error) {
    if (error instanceof Error && /unique/i.test(error.message)) {
      throw new Error(`Тариф на ${formatDurationLabel(data.durationDays)} уже существует`);
    }
    throw error;
  }

  const [tier] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return tier;
}

export async function updateAdminTier(
  id: string,
  data: Partial<{
    name: string;
    price: number;
    durationDays: number;
    isActive: boolean;
    externalUrl: string | null;
  }>
) {
  const [current] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!current) throw new Error("Тариф не найден");

  const patch: Partial<{
    name: string;
    price: number;
    durationDays: number;
    isActive: boolean;
    externalUrl: string | null;
    slug: string;
    updatedAt: Date;
  }> = { updatedAt: new Date() };

  if (data.name !== undefined) patch.name = data.name;
  if (data.price !== undefined) patch.price = data.price;
  if (data.durationDays !== undefined) patch.durationDays = data.durationDays;
  if (data.isActive !== undefined) patch.isActive = data.isActive;
  if (data.externalUrl !== undefined) {
    patch.externalUrl = normalizeExternalUrl(data.externalUrl);
  }

  if (data.durationDays !== undefined && data.durationDays !== current.durationDays) {
    const [duplicate] = await db
      .select({ id: products.id })
      .from(products)
      .where(
        and(
          eq(products.lineId, current.lineId!),
          eq(products.durationDays, data.durationDays),
          ne(products.id, id)
        )
      )
      .limit(1);

    if (duplicate) {
      throw new Error(`Тариф на ${formatDurationLabel(data.durationDays)} уже существует`);
    }

    const [line] = await db
      .select({ slug: productLines.slug, categorySlug: categories.slug })
      .from(productLines)
      .innerJoin(categories, eq(categories.id, productLines.categoryId))
      .where(eq(productLines.id, current.lineId!))
      .limit(1);

    if (line) {
      patch.slug = `${line.categorySlug}-${line.slug}-${data.durationDays}d`;
    }
  }

  try {
    await db.update(products).set(patch).where(eq(products.id, id));
  } catch (error) {
    if (error instanceof Error && /unique/i.test(error.message)) {
      throw new Error("Тариф с таким сроком уже существует");
    }
    throw error;
  }

  const [tier] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return tier;
}

export async function deleteAdminTier(id: string) {
  const [sold] = await db
    .select({ count: sql<number>`count(*)` })
    .from(licenseKeys)
    .where(and(eq(licenseKeys.productId, id), eq(licenseKeys.status, "sold")));

  if ((sold?.count ?? 0) > 0) {
    throw new Error("Нельзя удалить тариф с проданными ключами");
  }

  await db.delete(products).where(eq(products.id, id));
}

export function jsonArrayToLines(value: string | null): string {
  if (!value) return "";
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.join("\n") : "";
  } catch {
    return "";
  }
}

export function galleryToJsonArray(text: string): string | null {
  const items = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return items.length ? JSON.stringify(items) : null;
}
