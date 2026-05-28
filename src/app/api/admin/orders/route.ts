import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { orders, products, users } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  try {
    await requireAdmin();
    const items = await db
      .select({
        order: orders,
        product: products,
        user: users,
      })
      .from(orders)
      .innerJoin(products, eq(orders.productId, products.id))
      .innerJoin(users, eq(orders.userId, users.id))
      .orderBy(desc(orders.createdAt));

    return NextResponse.json({ orders: items });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
