"use client";

import { useEffect, useMemo, useState } from "react";
import { Headphones } from "lucide-react";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { PurchaseButton } from "./PurchaseButton";
import {
  formatDurationLabel,
  getInitialTierId,
  hasExternalUrl,
  isTierPurchasable,
  type ProductTier,
} from "@/lib/product-utils";

interface ProductBuyCardProps {
  lineName: string;
  gameName: string;
  tiers: ProductTier[];
  initialDurationDays?: number | null;
}

export function ProductBuyCard({
  lineName,
  gameName,
  tiers,
  initialDurationDays,
}: ProductBuyCardProps) {
  const { formatPriceWithBase } = useCurrency();
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

  const selectedDaily = selected.price / Math.max(selected.durationDays, 1);
  const selectedPrice = formatPriceWithBase(selected.price);
  const selectedDailyPrice = formatPriceWithBase(selectedDaily);

  return (
    <div className="card overflow-hidden border-[rgba(232,185,35,0.18)]">
      <div className="border-b border-[var(--color-border)] bg-[rgba(232,185,35,0.05)] px-5 py-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
          Стоимость
        </p>
        <div className="mt-2.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="price-value price-value-lg">{selectedPrice.primary}</span>
          {selectedPrice.secondary && (
            <span className="text-sm text-[var(--color-text-muted)]">≈ {selectedPrice.secondary}</span>
          )}
        </div>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          {formatDurationLabel(selected.durationDays)} · ~{selectedDailyPrice.primary}/день
        </p>
      </div>

      <div className="space-y-2 p-4">
        {tiers.map((tier) => {
          const isSelected = tier.id === selected.id;
          const purchasable = isTierPurchasable(tier);
          const daily = tier.price / Math.max(tier.durationDays, 1);

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
              <span className="text-xs text-[var(--color-text-muted)]">
                {formatPriceWithBase(tier.price).primary} · ~{formatPriceWithBase(daily).primary}/день
              </span>
            </button>
          );
        })}
      </div>

      <div className="border-t border-[var(--color-border)] p-4">
        <PurchaseButton
          productId={selected.id}
          productName={`${gameName} — ${lineName}`}
          price={selected.price}
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
