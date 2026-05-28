import type { Product } from "@/lib/db/schema";

export type ProductTier = Product;

export const TIER_PRESET_DAYS = [1, 3, 7, 14, 30, 90] as const;

export function hasExternalUrl(tier: Pick<ProductTier, "externalUrl">): boolean {
  return Boolean(tier.externalUrl?.trim());
}

export function isTierPurchasable(tier: Pick<ProductTier, "externalUrl" | "stockCount">): boolean {
  return hasExternalUrl(tier) || tier.stockCount > 0;
}

export function normalizeExternalUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (!/^https?:\/\//i.test(trimmed)) {
    throw new Error("Ссылка должна начинаться с http:// или https://");
  }
  return trimmed;
}

export function sortTiers<T extends ProductTier>(tiers: T[]): T[] {
  return [...tiers].sort((a, b) => a.durationDays - b.durationDays || a.price - b.price);
}

export function formatTierPillLabel(days: number): string {
  if (days === 1) return "1D";
  if (days === 7) return "7D";
  if (days === 30) return "30D";
  return `${days}D`;
}

export function findTierByDuration(tiers: ProductTier[], durationDays: number) {
  return tiers.find((tier) => tier.durationDays === durationDays) ?? null;
}

export function getInitialTierId(
  tiers: ProductTier[],
  preferredDurationDays?: number | null
): string | null {
  const sorted = sortTiers(tiers);
  if (preferredDurationDays) {
    const preferred = findTierByDuration(sorted, preferredDurationDays);
    if (preferred && isTierPurchasable(preferred)) return preferred.id;
  }

  const bestId = getBestValueTierId(sorted);
  const best = sorted.find((tier) => tier.id === bestId);
  if (best && isTierPurchasable(best)) return best.id;

  return sorted.find((tier) => isTierPurchasable(tier))?.id ?? sorted[0]?.id ?? null;
}

export function getBestValueTierId(tiers: ProductTier[]): string | null {
  if (tiers.length === 0) return null;

  let best = tiers[0];
  let bestDaily = best.price / Math.max(best.durationDays, 1);

  for (const tier of tiers.slice(1)) {
    const daily = tier.price / Math.max(tier.durationDays, 1);
    if (daily < bestDaily) {
      best = tier;
      bestDaily = daily;
    }
  }

  return best.id;
}

export function formatDurationLabel(days: number): string {
  const mod10 = days % 10;
  const mod100 = days % 100;
  if (mod10 === 1 && mod100 !== 11) return `${days} день`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${days} дня`;
  return `${days} дней`;
}

export function parseJsonArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function linesToJsonArray(text: string): string | null {
  const items = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return items.length ? JSON.stringify(items) : null;
}

export function jsonArrayToLines(value: string | null): string {
  return parseJsonArray(value).join("\n");
}

export function galleryToJsonArray(text: string): string | null {
  return linesToJsonArray(text);
}
