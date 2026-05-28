import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { previewPromoCode } from "@/lib/services/shop";
import {
  clearActivePromoCode,
  getActivePromoCode,
  setActivePromoCode,
} from "@/lib/promo-cookie";
import { formatCurrency } from "@/lib/utils";

function formatDiscount(promo: { discountType: string; discountValue: number }) {
  if (promo.discountType === "percent") return `${promo.discountValue}%`;
  return formatCurrency(promo.discountValue);
}

export async function GET() {
  try {
    await requireAuth();
    const code = await getActivePromoCode();
    if (!code) return NextResponse.json({ active: null });

    const promo = await previewPromoCode(code);
    return NextResponse.json({
      active: {
        code: promo.code,
        discountLabel: formatDiscount(promo),
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        minOrderAmount: promo.minOrderAmount,
      },
    });
  } catch {
    await clearActivePromoCode();
    return NextResponse.json({ active: null });
  }
}

const schema = z.object({
  code: z.string().min(1).max(64),
});

export async function POST(request: Request) {
  try {
    await requireAuth();
    const { code } = schema.parse(await request.json());
    const promo = await previewPromoCode(code);
    await setActivePromoCode(promo.code);

    return NextResponse.json({
      active: {
        code: promo.code,
        discountLabel: formatDiscount(promo),
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        minOrderAmount: promo.minOrderAmount,
      },
      message: "Промокод активирован — скидка применится при следующей покупке",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось активировать промокод";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE() {
  try {
    await requireAuth();
    await clearActivePromoCode();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
