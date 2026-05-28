export type DisplayCurrency = "RUB" | "EUR";

export interface ExchangeRates {
  eurRub: number;
  usdRub: number;
  source: string;
  updatedAt: Date | string;
}

const EU_LANGUAGE_PREFIXES = [
  "de",
  "fr",
  "es",
  "it",
  "nl",
  "pl",
  "pt",
  "sv",
  "fi",
  "da",
  "cs",
  "sk",
  "hu",
  "ro",
  "bg",
  "hr",
  "sl",
  "et",
  "lv",
  "lt",
  "el",
  "mt",
  "en-gb",
];

export function getDefaultRates(): ExchangeRates {
  return {
    eurRub: Number(process.env.EUR_RUB_RATE ?? process.env.NEXT_PUBLIC_EUR_RUB_RATE ?? "98"),
    usdRub: Number(process.env.PLATEGA_USD_RATE ?? process.env.NEXT_PUBLIC_PLATEGA_USD_RATE ?? "95"),
    source: "env",
    updatedAt: new Date(),
  };
}

export function getDisplayCurrency(cookieValue?: string | null): DisplayCurrency {
  if (cookieValue === "RUB" || cookieValue === "EUR") return cookieValue;
  return "RUB";
}

export function detectDisplayCurrencyFromLanguage(acceptLanguage?: string | null): DisplayCurrency {
  if (!acceptLanguage) return "RUB";
  const primary = acceptLanguage.split(",")[0]?.trim().toLowerCase() ?? "";
  if (primary.startsWith("ru")) return "RUB";
  if (EU_LANGUAGE_PREFIXES.some((lang) => primary.startsWith(lang))) return "EUR";
  return "RUB";
}

export function rubToEur(amountRub: number, eurRub: number): number {
  if (!eurRub) return amountRub;
  return Math.round((amountRub / eurRub) * 100) / 100;
}

export function eurToRub(amountEur: number, eurRub: number): number {
  return Math.round(amountEur * eurRub * 100) / 100;
}

export function formatRub(amount: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export function formatEur(amount: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPrice(
  amountRub: number,
  currency: DisplayCurrency,
  eurRub: number
): string {
  if (currency === "EUR") return formatEur(rubToEur(amountRub, eurRub));
  return formatRub(amountRub);
}

export function formatPriceWithBase(
  amountRub: number,
  currency: DisplayCurrency,
  eurRub: number
): { primary: string; secondary?: string } {
  if (currency === "EUR") {
    return {
      primary: formatEur(rubToEur(amountRub, eurRub)),
      secondary: formatRub(amountRub),
    };
  }
  return { primary: formatRub(amountRub) };
}
