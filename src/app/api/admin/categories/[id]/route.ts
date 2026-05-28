import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import {
  getAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
} from "@/lib/services/admin-catalog";

const schema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().optional(),
  description: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  sortOrder: z.number().optional(),
  isActive: z.boolean().optional(),
});

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteProps) {
  try {
    await requireAdmin();
    const { id } = await params;
    const category = await getAdminCategory(id);
    if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(category);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function PUT(request: Request, { params }: RouteProps) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = schema.parse(await request.json());
    await updateAdminCategory(id, body);
    const category = await getAdminCategory(id);
    return NextResponse.json(category);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: RouteProps) {
  try {
    await requireAdmin();
    const { id } = await params;
    await deleteAdminCategory(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
