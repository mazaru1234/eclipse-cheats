import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { createOrder } from "@/lib/services/shop";
import { refreshSession } from "@/lib/auth";
import { getActivePromoCode, clearActivePromoCode } from "@/lib/promo-cookie";

const schema = z.object({
  productId: z.string(),
  promoCode: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = schema.parse(await request.json());
    const savedPromo = body.promoCode ? undefined : await getActivePromoCode();
    const result = await createOrder({
      userId: session.id,
      productId: body.productId,
      promoCode: body.promoCode ?? savedPromo ?? undefined,
    });
    if (savedPromo) await clearActivePromoCode();
    await refreshSession(session.id);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Order failed";
    const status = message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
