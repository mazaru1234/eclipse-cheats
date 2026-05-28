"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ExternalLink, ShoppingCart } from "lucide-react";
import { TierPicker } from "@/components/shop/TierPicker";
import {
  formatDurationLabel,
  getInitialTierId,
  hasExternalUrl,
  isTierPurchasable,
  type ProductTier,
} from "@/lib/product-utils";
import { formatPrice, type DisplayCurrency } from "@/lib/currency";

interface ProductLineTierFooterProps {
  tiers: ProductTier[];
  href: string;
  displayCurrency: DisplayCurrency;
  eurRub: number;
  inStock: boolean;
}

export function ProductLineTierFooter({
  tiers,
  href,
  displayCurrency,
  eurRub,
  inStock,
}: ProductLineTierFooterProps) {
  const initialId = useMemo(() => getInitialTierId(tiers), [tiers]);
  const [selectedId, setSelectedId] = useState(initialId ?? tiers[0]?.id ?? "");

  const selected = tiers.find((tier) => tier.id === selectedId) ?? tiers[0];
  const buyHref = selected ? `${href}?d=${selected.durationDays}` : href;
  const selectedPurchasable = selected ? isTierPurchasable(selected) : false;

  if (!selected) {
    return (
      <div className="px-4 py-3.5 text-xs text-[var(--color-danger)]">
        Нет доступных тарифов
      </div>
    );
  }

  return (
    <div className="space-y-3 bg-[var(--color-bg-elevated)]/80 px-4 py-3.5">
      <TierPicker tiers={tiers} selectedId={selected.id} onSelect={setSelectedId} size="sm" />

      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
            <span className="price-value price-value-md">
              {formatPrice(selected.price, displayCurrency, eurRub)}
            </span>
            <span className="text-sm text-[var(--color-text-muted)]">
              / {selected.durationDays === 1 ? "сутки" : formatDurationLabel(selected.durationDays)}
            </span>
          </div>
          {!inStock && !hasExternalUrl(selected) && (
            <p className="mt-1 text-xs text-[var(--color-danger)]">Нет в наличии</p>
          )}
          {hasExternalUrl(selected) && (
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">Покупка у партнёра</p>
          )}
          {!selectedPurchasable && tiers.some((tier) => isTierPurchasable(tier)) && (
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">Выберите другой срок</p>
          )}
        </div>

        {hasExternalUrl(selected) ? (
          <a
            href={selected.externalUrl!}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary shrink-0 px-3 py-2 text-xs font-semibold uppercase tracking-wide"
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
            Купить
          </a>
        ) : (
          <Link
            href={buyHref}
            className="btn btn-primary shrink-0 px-3 py-2 text-xs font-semibold uppercase tracking-wide"
          >
            <ShoppingCart className="h-4 w-4" aria-hidden />
            Купить
          </Link>
        )}
      </div>
    </div>
  );
}
