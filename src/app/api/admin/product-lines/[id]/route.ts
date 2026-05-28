import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { PRODUCT_STATUSES } from "@/lib/product-status";import {
  getAdminProductLine,
  updateAdminProductLine,
  deleteAdminProductLine,
} from "@/lib/services/admin-catalog";

const schema = z.object({
  categoryId: z.string().optional(),
  name: z.string().min(1).optional(),
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

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteProps) {
  try {
    await requireAdmin();
    const { id } = await params;
    const line = await getAdminProductLine(id);
    if (!line) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(line);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function PUT(request: Request, { params }: RouteProps) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = schema.parse(await request.json());
    await updateAdminProductLine(id, body);
    const line = await getAdminProductLine(id);
    return NextResponse.json(line);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: RouteProps) {
  try {
    await requireAdmin();
    const { id } = await params;
    await deleteAdminProductLine(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
