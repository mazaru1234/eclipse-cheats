import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { updateAdminTier, deleteAdminTier } from "@/lib/services/admin-catalog";

const schema = z.object({
  name: z.string().optional(),
  price: z.number().positive().optional(),
  durationDays: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
  externalUrl: z.string().nullable().optional(),
});

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteProps) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = schema.parse(await request.json());
    const tier = await updateAdminTier(id, body);
    return NextResponse.json(tier);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: RouteProps) {
  try {
    await requireAdmin();
    const { id } = await params;
    await deleteAdminTier(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
