import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import {
  listAdminTiers,
  createAdminTier,
  getAdminProductLine,
} from "@/lib/services/admin-catalog";

const schema = z.object({
  lineId: z.string(),
  price: z.number().min(0),
  durationDays: z.number().int().positive(),
  name: z.string().optional(),
  externalUrl: z.string().nullable().optional(),
});

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const lineId = new URL(request.url).searchParams.get("lineId");
    if (!lineId) return NextResponse.json({ error: "lineId required" }, { status: 400 });
    const tiers = await listAdminTiers(lineId);
    return NextResponse.json({ tiers });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = schema.parse(await request.json());
    const line = await getAdminProductLine(body.lineId);
    if (!line) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const tier = await createAdminTier({
      lineId: body.lineId,
      categoryId: line.categoryId,
      categorySlug: line.categorySlug,
      lineSlug: line.slug,
      price: body.price,
      durationDays: body.durationDays,
      name: body.name,
      externalUrl: body.externalUrl,
    });

    return NextResponse.json(tier);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
