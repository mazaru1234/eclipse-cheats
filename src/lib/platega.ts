const PLATEGA_BASE = "https://app.platega.io";

export const PLATEGA_METHODS = {
  sbp: { id: 2, label: "СБП (QR)", currencies: ["RUB"] },
  card: { id: 11, label: "Карты РФ", currencies: ["RUB"] },
  intl: { id: 12, label: "Международные карты", currencies: ["USD", "EUR"] },
  crypto: { id: 13, label: "Криптовалюта", currencies: ["USDT"] },
  auto: { id: null, label: "Выбор на странице Platega", currencies: ["RUB"] },
} as const;

export type PlategaMethodKey = keyof typeof PLATEGA_METHODS;

interface CreatePlategaPaymentParams {
  amountRub: number;
  currency?: string;
  description: string;
  returnUrl: string;
  failedUrl: string;
  payload: string;
  paymentMethod?: number | null;
}

interface PlategaCreateResponse {
  transactionId: string;
  status: string;
  url?: string;
  redirect?: string;
}

import { safeEqual } from "./security";

function getCredentials() {
  const merchantId = process.env.PLATEGA_MERCHANT_ID;
  const secret = process.env.PLATEGA_SECRET;
  if (!merchantId || !secret) {
    throw new Error("Platega не настроена: добавьте PLATEGA_MERCHANT_ID и PLATEGA_SECRET в .env");
  }
  return { merchantId, secret };
}

export async function createPlategaPayment(params: CreatePlategaPaymentParams) {
  const { merchantId, secret } = getCredentials();

  const body: Record<string, unknown> = {
    paymentDetails: {
      amount: Math.round(params.amountRub * 100) / 100,
      currency: params.currency ?? "RUB",
    },
    description: params.description,
    return: params.returnUrl,
    failedUrl: params.failedUrl,
    payload: params.payload,
  };

  if (params.paymentMethod != null) {
    body.paymentMethod = params.paymentMethod;
  }

  for (const path of ["/transaction/process", "/v2/transaction/process"]) {
    const res = await fetch(`${PLATEGA_BASE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-MerchantId": merchantId,
        "X-Secret": secret,
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = (await res.json()) as PlategaCreateResponse;
      const paymentUrl = data.url ?? data.redirect;
      if (!paymentUrl || !data.transactionId) {
        throw new Error("Platega: некорректный ответ");
      }
      return { transactionId: data.transactionId, paymentUrl, status: data.status };
    }

    if (path === "/v2/transaction/process") {
      const errText = await res.text();
      throw new Error(`Platega error: ${errText || res.statusText}`);
    }
  }

  throw new Error("Platega: не удалось создать платёж");
}

export function verifyPlategaCallbackHeaders(merchantId: string, secret: string) {
  const expected = getCredentials();
  return safeEqual(merchantId, expected.merchantId) && safeEqual(secret, expected.secret);
}

export function calcPayAmountRub(amountRub: number, feePercent = 5) {
  const payAmountRub = Math.round(amountRub * (1 + feePercent / 100) * 100) / 100;
  return { amountRub, payAmountRub, feePercent };
}

/** @deprecated используйте calcPayAmountRub — баланс теперь в рублях */
export function usdToRub(usd: number): number {
  const rate = Number(process.env.PLATEGA_USD_RATE ?? "95");
  return Math.round(usd * rate * 100) / 100;
}
