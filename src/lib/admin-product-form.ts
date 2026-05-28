import { jsonArrayToLines } from "@/lib/product-utils";
import type { ProductStatus } from "@/lib/product-status";

export type FeatureGroup = {
  name: string;
  items: string[];
};

export function parseFeatureGroups(value: string | null): FeatureGroup[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed) || parsed.length === 0) return [];

    if (typeof parsed[0] === "object" && parsed[0] !== null && "name" in parsed[0]) {
      return parsed
        .filter((group) => group && typeof group.name === "string")
        .map((group) => ({
          name: group.name,
          items: Array.isArray(group.items)
            ? group.items.filter((item: unknown) => typeof item === "string" && item.trim())
            : [],
        }))
        .filter((group) => group.name.trim());
    }

    if (parsed.every((item) => typeof item === "string")) {
      return [{ name: "Функционал", items: parsed }];
    }
  } catch {
    return [];
  }

  return [];
}

export function featureGroupsToJson(groups: FeatureGroup[]): string | null {
  const cleaned = groups
    .map((group) => ({
      name: group.name.trim(),
      items: group.items.map((item) => item.trim()).filter(Boolean),
    }))
    .filter((group) => group.name && group.items.length > 0);

  return cleaned.length ? JSON.stringify(cleaned) : null;
}

export function createEmptyFeatureGroup(name = ""): FeatureGroup {
  return { name, items: [] };
}

export interface ProductLineFormData {
  id?: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  longDescription: string;
  imageUrl: string;
  galleryText: string;
  featureGroups: FeatureGroup[];
  systemRequirementsText: string;
  safetyRating: number;
  functionalityRating: number;
  status: ProductStatus;
  needsUsb: boolean;
  hasSpoofer: boolean;
  isActive: boolean;
  sortOrder: number;
}

export function productLineToFormData(line: {
  id: string;
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
}): ProductLineFormData {
  const groups = parseFeatureGroups(line.features);

  return {
    id: line.id,
    categoryId: line.categoryId,
    name: line.name,
    slug: line.slug,
    description: line.description ?? "",
    longDescription: line.longDescription ?? "",
    imageUrl: line.imageUrl ?? "",
    galleryText: jsonArrayToLines(line.galleryUrls),
    featureGroups: groups.length ? groups : [createEmptyFeatureGroup("AIM")],
    systemRequirementsText: jsonArrayToLines(line.systemRequirements),
    safetyRating: line.safetyRating,
    functionalityRating: line.functionalityRating,
    status: line.status,
    needsUsb: line.needsUsb,
    hasSpoofer: line.hasSpoofer,
    isActive: line.isActive,
    sortOrder: line.sortOrder,
  };
}
