"use client";

import { useCurrency } from "@/components/providers/CurrencyProvider";
import { cn } from "@/lib/utils";

export function CurrencySwitcher({ className }: { className?: string }) {
  const { displayCurrency, setDisplayCurrency, switching, rates } = useCurrency();

  return (
    <div className={cn("flex items-center gap-1 rounded-full border border-[var(--color-border)] p-0.5", className)}>
      {(["RUB", "EUR"] as const).map((currency) => (
        <button
          key={currency}
          type="button"
          disabled={switching}
          onClick={() => setDisplayCurrency(currency)}
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors",
            displayCurrency === currency
              ? "bg-[rgba(232,185,35,0.15)] text-gold"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          )}
          title={
            currency === "EUR"
              ? `Курс €1 = ${rates.eurRub.toFixed(2)} ₽, обновляется раз в неделю`
              : "Цены в рублях"
          }
        >
          {currency === "RUB" ? "₽" : "€"}
        </button>
      ))}
    </div>
  );
}
