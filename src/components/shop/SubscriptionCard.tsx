"use client";

import { useCurrency } from "@/components/providers/CurrencyProvider";
import { PurchaseButton } from "./PurchaseButton";
import { Clock, Package } from "lucide-react";

interface SubscriptionCardProps {
  id: string;
  name: string;
  description: string | null;
  price: number;
  durationDays: number;
  stockCount: number;
  gameName: string;
}

export function SubscriptionCard({
  id,
  name,
  description,
  price,
  durationDays,
  stockCount,
  gameName,
}: SubscriptionCardProps) {
  const { formatPrice } = useCurrency();
  const inStock = stockCount > 0;

  return (
    <article className="card card-hover flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            {gameName}
          </p>
          <h3 className="mt-1 font-display text-xl font-bold leading-tight">{name}</h3>
        </div>
        <span className="font-display text-xl font-bold tabular-nums text-gold shrink-0">
          {formatPrice(price)}
        </span>
      </div>

      {description && (
        <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--color-text-secondary)] line-clamp-2">
          {description}
        </p>
      )}

      <div className="mt-4 flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" aria-hidden />
          {durationDays} дн.
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Package className="h-3.5 w-3.5" aria-hidden />
          <span className={inStock ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}>
            {inStock ? `${stockCount} ключей` : "Нет в наличии"}
          </span>
        </span>
      </div>

      <div className="mt-5 border-t border-[var(--color-border)] pt-4">
        <PurchaseButton
          productId={id}
          productName={`${gameName} — ${name}`}
          price={price}
          inStock={inStock}
        />
      </div>
    </article>
  );
}
