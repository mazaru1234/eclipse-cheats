import type { Metadata } from "next";
import { Syne, Manrope } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { initDatabase } from "@/lib/db/init";
import { CurrencyProvider } from "@/components/providers/CurrencyProvider";
import { getDisplayCurrency, getDefaultRates } from "@/lib/currency";
import { getExchangeRates } from "@/lib/services/exchange-rates";
import { getAppUrlOrNull } from "@/lib/env";

const syne = Syne({
  subsets: ["latin", "latin-ext"],
  variable: "--font-syne",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
  display: "swap",
});

const appUrl = getAppUrlOrNull() ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Eclipse Cheats — магазин лицензий",
    template: "%s | Eclipse Cheats",
  },
  description: "Eclipse Cheats — магазин читов с мгновенной выдачей ключей, балансом и защитой заказов.",
  applicationName: "Eclipse Cheats",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: appUrl,
    siteName: "Eclipse Cheats",
    title: "Eclipse Cheats — магазин лицензий",
    description: "Читы с мгновенной выдачей ключей, балансом и защитой заказов.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Eclipse Cheats — магазин лицензий",
    description: "Читы с мгновенной выдачей ключей, балансом и защитой заказов.",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await initDatabase();

  const cookieStore = await cookies();
  const displayCurrency = getDisplayCurrency(cookieStore.get("display_currency")?.value);

  let rates = getDefaultRates();
  try {
    const ratesRaw = await getExchangeRates();
    rates = {
      ...ratesRaw,
      updatedAt:
        ratesRaw.updatedAt instanceof Date
          ? ratesRaw.updatedAt.toISOString()
          : ratesRaw.updatedAt,
    };
  } catch (error) {
    console.error("Exchange rates unavailable:", error);
  }

  return (
    <html lang="ru" className={`${syne.variable} ${manrope.variable}`}>
      <body className="antialiased">
        <CurrencyProvider initialCurrency={displayCurrency} initialRates={rates}>
          {children}
        </CurrencyProvider>
      </body>
    </html>
  );
}
