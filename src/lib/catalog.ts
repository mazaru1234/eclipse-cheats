import { db } from "@/lib/db";
import { categories, products, productLines } from "@/lib/db/schema";
import { eq, asc, sql, and, isNull, gt } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  isTierPurchasable,
  parseJsonArray,
  type ProductTier,
} from "@/lib/product-utils";
import { parseFeatureGroups, type FeatureGroup } from "@/lib/admin-product-form";

export type { ProductTier } from "@/lib/product-utils";
export { formatDurationLabel, formatTierPillLabel, getBestValueTierId, getInitialTierId, sortTiers, TIER_PRESET_DAYS } from "@/lib/product-utils";

export type ProductLineWithMeta = typeof productLines.$inferSelect & {
  tiers: ProductTier[];
  minPrice: number;
  maxPrice: number;
  minPriceDays: number;
  tierCount: number;
  inStock: boolean;
};

export type ProductLineDetail = Omit<
  typeof productLines.$inferSelect,
  "galleryUrls" | "features" | "systemRequirements"
> & {
  tiers: ProductTier[];
  gallery: string[];
  featureGroups: FeatureGroup[];
  systemRequirements: string[];
};

function buildGallery(line: typeof productLines.$inferSelect): string[] {
  const gallery = parseJsonArray(line.galleryUrls);
  if (gallery.length > 0) return gallery;
  if (line.imageUrl?.trim()) return [line.imageUrl.trim()];
  return [];
}

function enrichProductLine(
  line: typeof productLines.$inferSelect,
  tiers: ProductTier[]
): ProductLineDetail {
  return {
    ...line,
    tiers,
    gallery: buildGallery(line),
    featureGroups: parseFeatureGroups(line.features),
    systemRequirements: parseJsonArray(line.systemRequirements),
  };
}

export async function getActiveGames() {
  return db
    .select()
    .from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(asc(categories.sortOrder));
}

export async function getGamesWithProductCounts() {
  const games = await getActiveGames();

  const counts = await db
    .select({
      categoryId: productLines.categoryId,
      count: sql<number>`count(*)`,
    })
    .from(productLines)
    .where(eq(productLines.isActive, true))
    .groupBy(productLines.categoryId);

  const countMap = new Map(counts.map((c) => [c.categoryId, c.count ?? 0]));

  return games
    .map((game) => ({
      game,
      productCount: countMap.get(game.id) ?? 0,
    }))
    .filter((g) => g.productCount > 0);
}

export async function getGameBySlug(slug: string) {
  const [game] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.slug, slug), eq(categories.isActive, true)))
    .limit(1);

  return game ?? null;
}

export async function getGameProductLines(gameId: string): Promise<ProductLineWithMeta[]> {
  const lines = await db
    .select()
    .from(productLines)
    .where(and(eq(productLines.categoryId, gameId), eq(productLines.isActive, true)))
    .orderBy(asc(productLines.sortOrder), asc(productLines.name));

  const tiers = await db
    .select()
    .from(products)
    .where(and(eq(products.categoryId, gameId), eq(products.isActive, true), gt(products.price, 0)))
    .orderBy(asc(products.durationDays));

  const tiersByLine = new Map<string, ProductTier[]>();
  for (const tier of tiers) {
    if (!tier.lineId) continue;
    const list = tiersByLine.get(tier.lineId) ?? [];
    list.push(tier);
    tiersByLine.set(tier.lineId, list);
  }

  return lines
    .map((line) => {
      const lineTiers = tiersByLine.get(line.id) ?? [];
      const prices = lineTiers.map((t) => t.price);
      const minPrice = prices.length ? Math.min(...prices) : 0;
      const maxPrice = prices.length ? Math.max(...prices) : 0;
      const cheapestTier =
        lineTiers.length > 0
          ? lineTiers.reduce((min, tier) => (tier.price < min.price ? tier : min), lineTiers[0])
          : null;
      const inStock = lineTiers.some((t) => isTierPurchasable(t));

      return {
        ...line,
        tiers: lineTiers,
        minPrice,
        maxPrice,
        minPriceDays: cheapestTier?.durationDays ?? 0,
        tierCount: lineTiers.length,
        inStock,
      };
    })
    .filter((line) => line.tierCount > 0);
}

/** @deprecated use getGameProductLines */
export async function getGameProducts(gameId: string) {
  return db
    .select()
    .from(products)
    .where(and(eq(products.categoryId, gameId), eq(products.isActive, true)))
    .orderBy(asc(products.durationDays));
}

export async function getProductLineBySlug(gameSlug: string, lineSlug: string) {
  const game = await getGameBySlug(gameSlug);
  if (!game) return null;

  const [line] = await db
    .select()
    .from(productLines)
    .where(
      and(
        eq(productLines.categoryId, game.id),
        eq(productLines.slug, lineSlug),
        eq(productLines.isActive, true)
      )
    )
    .limit(1);

  if (!line) return null;

  const tiers = await db
    .select()
    .from(products)
    .where(
      and(
        eq(products.lineId, line.id),
        eq(products.categoryId, game.id),
        eq(products.isActive, true),
        gt(products.price, 0)
      )
    )
    .orderBy(asc(products.durationDays));

  if (tiers.length === 0) return null;

  return {
    game,
    line: enrichProductLine(line, tiers),
  };
}

export async function getSimilarProductLines(gameId: string, excludeLineId: string, limit = 4) {
  const lines = await getGameProductLines(gameId);
  return lines.filter((line) => line.id !== excludeLineId).slice(0, limit);
}

export async function ensureProductLinesMigrated() {
  const orphaned = await db
    .select()
    .from(products)
    .where(isNull(products.lineId));

  if (orphaned.length === 0) return;

  const games = await db.select().from(categories);
  const productsByGame = new Map<string, typeof orphaned>();

  for (const product of orphaned) {
    const list = productsByGame.get(product.categoryId) ?? [];
    list.push(product);
    productsByGame.set(product.categoryId, list);
  }

  for (const game of games) {
    const gameProducts = productsByGame.get(game.id);
    if (!gameProducts?.length) continue;

    const lineId = nanoid();
    const lineSlug = `${game.slug}-pro`;

    await db.insert(productLines).values({
      id: lineId,
      categoryId: game.id,
      name: `${game.name} Pro`,
      slug: lineSlug,
      description: game.description,
      longDescription: game.description,
      isActive: true,
      sortOrder: 0,
    });

    for (const product of gameProducts) {
      await db
        .update(products)
        .set({ lineId, updatedAt: new Date() })
        .where(eq(products.id, product.id));
    }
  }
}
