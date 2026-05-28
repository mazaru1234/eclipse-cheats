import { calculateDiscount } from "@/lib/utils";

export interface ActivePromo {
  code: string;
  discountLabel: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  minOrderAmount: number;
}

export function getPromoDiscount(price: number, promo: ActivePromo | null | undefined): number {
  if (!promo || price < promo.minOrderAmount) return 0;
  return calculateDiscount(price, promo.discountType, promo.discountValue);
}

export function getPromoFinalPrice(price: number, promo: ActivePromo | null | undefined): number {
  return Math.max(0, price - getPromoDiscount(price, promo));
}

export function promoAppliesToPrice(price: number, promo: ActivePromo | null | undefined): boolean {
  return getPromoDiscount(price, promo) > 0;
}
