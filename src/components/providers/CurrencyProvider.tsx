"use client";

import { createContext, useContext, useMemo, useState, useTransition, type ReactNode } from "react";
import {
  formatPrice,
  formatPriceWithBase,
  type DisplayCurrency,
  type ExchangeRates,
} from "@/lib/currency";

interface CurrencyContextValue {
  displayCurrency: DisplayCurrency;
  rates: ExchangeRates;
  formatPrice: (amountRub: number) => string;
  formatPriceWithBase: (amountRub: number) => { primary: string; secondary?: string };
  setDisplayCurrency: (currency: DisplayCurrency) => void;
  switching: boolean;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({
  children,
  initialCurrency,
  initialRates,
}: {
  children: ReactNode;
  initialCurrency: DisplayCurrency;
  initialRates: ExchangeRates;
}) {
  const [displayCurrency, setDisplayCurrencyState] = useState(initialCurrency);
  const [rates] = useState(initialRates);
  const [switching, startTransition] = useTransition();

  const value = useMemo<CurrencyContextValue>(
    () => ({
      displayCurrency,
      rates,
      formatPrice: (amountRub) => formatPrice(amountRub, displayCurrency, rates.eurRub),
      formatPriceWithBase: (amountRub) =>
        formatPriceWithBase(amountRub, displayCurrency, rates.eurRub),
      setDisplayCurrency: (currency) => {
        startTransition(() => {
          document.cookie = `display_currency=${currency};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
          setDisplayCurrencyState(currency);
        });
      },
      switching,
    }),
    [displayCurrency, rates, switching]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return ctx;
}
