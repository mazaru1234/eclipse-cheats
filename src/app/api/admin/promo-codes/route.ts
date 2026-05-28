import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { promoCodes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

const createSchema = z.object({
  code: z.string().min(3),
  discountType: z.enum(["percent", "fixed"]),
  discountValue: z.number().positive(),
  maxUses: z.number().nullable().optional(),
  minOrderAmount: z.number().optional(),
  expiresAt: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

const updateSchema = createSchema.partial().extend({
  id: z.string(),
});

export async function GET() {
  try {
    await requireAdmin();
    const items = await db.select().from(promoCodes);
    return NextResponse.json({ promoCodes: items });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = createSchema.parse(await request.json());

    await db.insert(promoCodes).values({
      id: nanoid(),
      code: body.code.toUpperCase(),
      discountType: body.discountType,
      discountValue: body.discountValue,
      maxUses: body.maxUses ?? null,
      minOrderAmount: body.minOrderAmount ?? 0,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      isActive: body.isActive ?? true,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const body = updateSchema.parse(await request.json());
    const { id, expiresAt, code, ...rest } = body;

    const patch: Record<string, unknown> = { ...rest };
    if (code !== undefined) patch.code = code.toUpperCase();
    if ("expiresAt" in body) {
      patch.expiresAt = expiresAt ? new Date(expiresAt) : null;
    }

    await db.update(promoCodes).set(patch).where(eq(promoCodes.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await db.delete(promoCodes).where(eq(promoCodes.id, id));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 400 });
  }
}
