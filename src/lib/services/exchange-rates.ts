import { cache } from "react";
import { eq } from "drizzle-orm";import { db } from "@/lib/db";
import { exchangeRates } from "@/lib/db/schema";
import { getDefaultRates, type ExchangeRates } from "@/lib/currency";

const REFRESH_MS = 7 * 24 * 60 * 60 * 1000;

async function fetchRatesFromApi(): Promise<Pick<ExchangeRates, "eurRub" | "usdRub" | "source">> {
  try {
    const res = await fetch("https://api.frankfurter.app/latest?from=EUR&to=RUB,USD", {
      next: { revalidate: 86400 },
    });
    if (!res.ok) throw new Error(`Frankfurter ${res.status}`);
    const data = (await res.json()) as { rates?: { RUB?: number; USD?: number } };
    const eurRub = data.rates?.RUB;
    const usdPerEur = data.rates?.USD;
    if (!eurRub || !usdPerEur) throw new Error("Incomplete rates");

    const usdRub = Math.round((eurRub / usdPerEur) * 100) / 100;
    return { eurRub, usdRub, source: "frankfurter" };
  } catch {
    const fallback = getDefaultRates();
    return {
      eurRub: fallback.eurRub,
      usdRub: fallback.usdRub,
      source: "env-fallback",
    };
  }
}

export const getExchangeRates = cache(async (forceRefresh = false): Promise<ExchangeRates> => {
  try {
    const [row] = await db.select().from(exchangeRates).where(eq(exchangeRates.id, "default")).limit(1);
    const now = Date.now();

    if (row && !forceRefresh && now - row.updatedAt.getTime() < REFRESH_MS) {
      return {
        eurRub: row.eurRub,
        usdRub: row.usdRub,
        source: row.source,
        updatedAt: row.updatedAt,
      };
    }

    const fresh = await fetchRatesFromApi();
    const updatedAt = new Date();

    if (row) {
      await db
        .update(exchangeRates)
        .set({
          eurRub: fresh.eurRub,
          usdRub: fresh.usdRub,
          source: fresh.source,
          updatedAt,
        })
        .where(eq(exchangeRates.id, "default"));
    } else {
      await db.insert(exchangeRates).values({
        id: "default",
        eurRub: fresh.eurRub,
        usdRub: fresh.usdRub,
        source: fresh.source,
        updatedAt,
      });
    }

    return { ...fresh, updatedAt };
  } catch {
    return getDefaultRates();
  }
});