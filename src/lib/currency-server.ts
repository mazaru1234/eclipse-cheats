import { cache } from "react";
import { cookies } from "next/headers";
import { getDisplayCurrency, type DisplayCurrency, type ExchangeRates } from "@/lib/currency";
import { getExchangeRates } from "@/lib/services/exchange-rates";

export const getShopCurrencyContext = cache(async (): Promise<{
  displayCurrency: DisplayCurrency;
  rates: ExchangeRates;
}> => {
  const cookieStore = await cookies();
  const displayCurrency = getDisplayCurrency(cookieStore.get("display_currency")?.value);
  const rates = await getExchangeRates();
  return { displayCurrency, rates };
});