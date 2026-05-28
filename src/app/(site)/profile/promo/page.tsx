import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getUserPromoUses } from "@/lib/services/payments";
import { formatCurrency } from "@/lib/utils";
import { PromoAccountClient } from "@/components/profile/PromoAccountClient";

export default async function PromoPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const uses = await getUserPromoUses(session.id);

  const history = uses.map(({ promo, order, use }) => ({
    id: use.id,
    code: promo.code,
    discountLabel:
      promo.discountType === "percent"
        ? `${promo.discountValue}%`
        : formatCurrency(promo.discountValue),
    orderAmount: order.amount,
    createdAt: use.createdAt.toISOString(),
  }));

  return (
    <>
      <h1 className="font-display text-3xl font-bold">Промокоды</h1>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
        Активация скидки и история использованных промокодов
      </p>
      <div className="mt-8">
        <PromoAccountClient history={history} />
      </div>
    </>
  );
}
