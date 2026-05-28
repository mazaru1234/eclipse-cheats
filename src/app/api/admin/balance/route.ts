import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { addBalance } from "@/lib/services/shop";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const schema = z.object({
  userId: z.string(),
  amount: z.number(),
  description: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = schema.parse(await request.json());

    const [user] = await db.select().from(users).where(eq(users.id, body.userId)).limit(1);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    await addBalance(
      body.userId,
      body.amount,
      "admin_adjustment",
      body.description ?? "Admin balance adjustment"
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET() {
  try {
    await requireAdmin();
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
        balance: users.balance,
        role: users.role,
        referralCode: users.referralCode,
        createdAt: users.createdAt,
      })
      .from(users);
    return NextResponse.json({ users: allUsers });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
