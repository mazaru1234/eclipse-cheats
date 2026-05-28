import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import {
  getAdminCategories,
  createAdminCategory,
} from "@/lib/services/admin-catalog";

const schema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  sortOrder: z.number().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("all") === "1";
    const categories = await getAdminCategories(includeInactive);
    return NextResponse.json({ categories });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = schema.parse(await request.json());
    const created = await createAdminCategory(body);
    return NextResponse.json(created);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
