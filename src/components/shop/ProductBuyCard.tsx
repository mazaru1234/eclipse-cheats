"use client";

import { useEffect, useMemo, useState } from "react";
import { Headphones } from "lucide-react";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { useActivePromo } from "@/hooks/useActivePromo";
import { PurchaseButton } from "./PurchaseButton";
import {
  formatDurationLabel,
  getInitialTierId,
  hasExternalUrl,
  isTierPurchasable,
  type ProductTier,
} from "@/lib/product-utils";
import {
  getPromoDiscount,
  getPromoFinalPrice,
  promoAppliesToPrice,
} from "@/lib/promo-utils";

interface ProductBuyCardProps {
  lineName: string;
  gameName: string;
  tiers: ProductTier[];
  initialDurationDays?: number | null;
}

function TierPrice({
  price,
  durationDays,
  promo,
  formatPriceWithBase,
}: {
  price: number;
  durationDays: number;
  promo: ReturnType<typeof useActivePromo>["promo"];
  formatPriceWithBase: ReturnType<typeof useCurrency>["formatPriceWithBase"];
}) {
  const finalPrice = getPromoFinalPrice(price, promo);
  const hasDiscount = promoAppliesToPrice(price, promo);
  const daily = finalPrice / Math.max(durationDays, 1);

  if (!hasDiscount) {
    const baseDaily = price / Math.max(durationDays, 1);
    return (
      <span className="text-xs text-[var(--color-text-muted)]">
        {formatPriceWithBase(price).primary} · ~{formatPriceWithBase(baseDaily).primary}/день
      </span>
    );
  }

  return (
    <span className="text-right text-xs">
      <span className="font-medium text-gold">{formatPriceWithBase(finalPrice).primary}</span>
      <span className="ml-1.5 text-[var(--color-text-muted)] line-through">
        {formatPriceWithBase(price).primary}
      </span>
      <span className="mt-0.5 block text-[var(--color-text-muted)]">
        ~{formatPriceWithBase(daily).primary}/день
      </span>
    </span>
  );
}

export function ProductBuyCard({
  lineName,
  gameName,
  tiers,
  initialDurationDays,
}: ProductBuyCardProps) {
  const { formatPriceWithBase } = useCurrency();
  const { promo } = useActivePromo();
  const initialId = useMemo(
    () => getInitialTierId(tiers, initialDurationDays),
    [tiers, initialDurationDays]
  );
  const [selectedId, setSelectedId] = useState(initialId ?? tiers[0]?.id ?? "");

  useEffect(() => {
    const nextId = getInitialTierId(tiers, initialDurationDays);
    if (nextId) setSelectedId(nextId);
  }, [initialDurationDays, tiers]);

  const selected = tiers.find((tier) => tier.id === selectedId) ?? tiers[0];

  if (!selected) {
    return (
      <div className="card p-6 text-center text-sm text-[var(--color-text-secondary)]">
        Тарифы недоступны
      </div>
    );
  }

  const selectedFinal = getPromoFinalPrice(selected.price, promo);
  const selectedDiscount = getPromoDiscount(selected.price, promo);
  const hasDiscount = selectedDiscount > 0;
  const selectedDaily = selectedFinal / Math.max(selected.durationDays, 1);
  const selectedPrice = formatPriceWithBase(hasDiscount ? selectedFinal : selected.price);
  const selectedDailyPrice = formatPriceWithBase(selectedDaily);

  return (
    <div className="card overflow-hidden border-[rgba(232,185,35,0.18)]">
      <div className="border-b border-[var(--color-border)] bg-[rgba(232,185,35,0.05)] px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
            Стоимость
          </p>
          {promo && (
            <span className="rounded-md border border-[rgba(232,185,35,0.35)] bg-[rgba(232,185,35,0.1)] px-2 py-0.5 font-mono text-[10px] text-gold">
              {promo.code} · −{promo.discountLabel}
            </span>
          )}
        </div>
        <div className="mt-2.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="price-value price-value-lg">{selectedPrice.primary}</span>
          {hasDiscount && (
            <span className="text-sm text-[var(--color-text-muted)] line-through">
              {formatPriceWithBase(selected.price).primary}
            </span>
          )}
          {selectedPrice.secondary && (
            <span className="text-sm text-[var(--color-text-muted)]">≈ {selectedPrice.secondary}</span>
          )}
        </div>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          {formatDurationLabel(selected.durationDays)} · ~{selectedDailyPrice.primary}/день
        </p>
        {promo && !hasDiscount && selected.price < promo.minOrderAmount && (
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">
            Промокод от {formatPriceWithBase(promo.minOrderAmount).primary}
          </p>
        )}
      </div>

      <div className="space-y-2 p-4">
        {tiers.map((tier) => {
          const isSelected = tier.id === selected.id;
          const purchasable = isTierPurchasable(tier);

          return (
            <button
              key={tier.id}
              type="button"
              onClick={() => setSelectedId(tier.id)}
              disabled={!purchasable}
              className={[
                "flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-left transition-all",
                isSelected
                  ? "border-[rgba(232,185,35,0.45)] bg-[rgba(232,185,35,0.08)]"
                  : "border-[var(--color-border)] bg-[var(--color-bg-elevated)] hover:border-[rgba(232,185,35,0.25)]",
                !purchasable ? "opacity-45" : "",
              ].join(" ")}
            >
              <div>
                <span className="text-sm font-medium">{formatDurationLabel(tier.durationDays)}</span>
                {hasExternalUrl(tier) && (
                  <p className="mt-0.5 text-[10px] text-[var(--color-text-muted)]">Покупка у партнёра</p>
                )}
              </div>
              <TierPrice
                price={tier.price}
                durationDays={tier.durationDays}
                promo={promo}
                formatPriceWithBase={formatPriceWithBase}
              />
            </button>
          );
        })}
      </div>

      <div className="border-t border-[var(--color-border)] p-4">
        <PurchaseButton
          productId={selected.id}
          productName={`${gameName} — ${lineName}`}
          price={selected.price}
          effectivePrice={selectedFinal}
          promo={promo}
          inStock={isTierPurchasable(selected)}
          externalUrl={selected.externalUrl}
          variant="large"
        />
        <a
          href="https://t.me/EclipseHacksss"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center justify-center gap-2 text-xs text-[var(--color-text-muted)] transition-colors hover:text-gold"
        >
          <Headphones className="h-3.5 w-3.5" aria-hidden />
          Нужна помощь?
        </a>
      </div>
    </div>
  );
}
