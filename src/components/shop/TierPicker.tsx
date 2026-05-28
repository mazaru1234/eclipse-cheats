"use client";

import { formatTierPillLabel, getBestValueTierId, isTierPurchasable, sortTiers, type ProductTier } from "@/lib/product-utils";

interface TierPickerProps {
  tiers: ProductTier[];
  selectedId: string;
  onSelect: (tierId: string) => void;
  size?: "sm" | "md";
  className?: string;
}

export function TierPicker({
  tiers,
  selectedId,
  onSelect,
  size = "md",
  className = "",
}: TierPickerProps) {
  const sorted = sortTiers(tiers);
  const bestTierId = getBestValueTierId(sorted);

  if (sorted.length === 0) return null;

  const pillClass =
    size === "sm"
      ? "min-w-[3rem] px-2.5 py-1.5 text-[11px]"
      : "min-w-[3.5rem] px-3 py-2 text-xs";

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`} role="radiogroup" aria-label="Выбор тарифа">
      {sorted.map((tier) => {
        const isSelected = tier.id === selectedId;
        const isBest = tier.id === bestTierId;
        const inStock = isTierPurchasable(tier);

        return (
          <button
            key={tier.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={!inStock}
            onClick={() => onSelect(tier.id)}
            className={[
              "relative rounded-lg border font-semibold uppercase tracking-wide transition-all",
              pillClass,
              isSelected
                ? "border-gold bg-[rgba(232,185,35,0.16)] text-gold shadow-[0_0_0_1px_rgba(232,185,35,0.25)]"
                : "border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:border-[rgba(232,185,35,0.35)] hover:text-gold",
              !inStock ? "cursor-not-allowed opacity-40" : "",
            ].join(" ")}
          >
            {formatTierPillLabel(tier.durationDays)}
            {isBest && inStock && (
              <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[var(--color-success)]" />
            )}
          </button>
        );
      })}
    </div>
  );
}
