import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { PRODUCT_STATUSES } from "@/lib/product-status";import {
  listAdminProductLines,
  createAdminProductLine,
} from "@/lib/services/admin-catalog";

const schema = z.object({
  categoryId: z.string(),
  name: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().nullable().optional(),
  longDescription: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  galleryUrls: z.string().nullable().optional(),
  features: z.string().nullable().optional(),
  systemRequirements: z.string().nullable().optional(),
  safetyRating: z.number().min(1).max(5).optional(),
  functionalityRating: z.number().min(1).max(5).optional(),
  status: z.enum(PRODUCT_STATUSES).optional(),
  needsUsb: z.boolean().optional(),
  hasSpoofer: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const result = await listAdminProductLines({
      categoryId: searchParams.get("categoryId") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      sort: (searchParams.get("sort") as "newest" | "oldest" | "name" | "price_asc" | "price_desc") ?? "newest",
      limit: Number(searchParams.get("limit") ?? 50),
      includeInactive: searchParams.get("all") === "1",
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = schema.parse(await request.json());
    const created = await createAdminProductLine(body);
    return NextResponse.json(created);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
