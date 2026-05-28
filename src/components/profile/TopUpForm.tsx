"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PLATEGA_METHODS, type PlategaMethodKey } from "@/lib/platega";
import { formatRub } from "@/lib/currency";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { cn } from "@/lib/utils";

const DEFAULT_PRESETS = [500, 1000, 2500, 5000, 10000];
const DEFAULT_FEE = 5;

interface TopupSettingsPublic {
  enabled: boolean;
  minAmountRub: number;
  maxAmountRub: number;
  feePercent: number;
  presetAmounts: number[];
  userDailyLimitRub: number;
  userDailyMaxCount: number;
}

function calcSummary(amountRub: number, feePercent: number) {
  const payAmountRub = Math.round(amountRub * (1 + feePercent / 100) * 100) / 100;
  return { amountRub, payAmountRub, feePercent };
}

const METHODS: { key: PlategaMethodKey; title: string; desc: string; badge?: string }[] = [
  { key: "auto", title: "Platega", desc: "Карты РФ + СБП — выбор на странице оплаты", badge: "Рекомендуется" },
  { key: "sbp", title: "СБП", desc: "Мгновенное зачисление через QR" },
  { key: "card", title: "Карты РФ", desc: "Банковские карты РФ" },
  { key: "intl", title: "Международные карты", desc: "EUR / USD — для EU и других стран" },
  { key: "crypto", title: "Криптовалюта", desc: "USDT и другие" },
];

export function TopUpForm() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const { formatPrice, displayCurrency } = useCurrency();

  const [settings, setSettings] = useState<TopupSettingsPublic | null>(null);
  const [amountRub, setAmountRub] = useState(1000);
  const [custom, setCustom] = useState("");
  const [method, setMethod] = useState<PlategaMethodKey>("auto");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/topup/settings")
      .then((res) => res.json())
      .then((data: TopupSettingsPublic) => {
        setSettings(data);
        if (data.presetAmounts?.length) setAmountRub(data.presetAmounts[0]);
      })
      .catch(() => setSettings(null));
  }, []);

  const presets = settings?.presetAmounts ?? DEFAULT_PRESETS;
  const feePercent = settings?.feePercent ?? DEFAULT_FEE;
  const minAmount = settings?.minAmountRub ?? 100;
  const maxAmount = settings?.maxAmountRub ?? 1_000_000;

  const selectedAmount = custom ? Number(custom) : amountRub;
  const summary = useMemo(
    () => calcSummary(Number.isFinite(selectedAmount) ? selectedAmount : 0, feePercent),
    [selectedAmount, feePercent]
  );

  async function handlePay() {
    const value = custom ? Number(custom) : amountRub;
    if (!value || value < minAmount) {
      setError(`Минимальная сумма — ${minAmount} ₽`);
      return;
    }
    if (value > maxAmount) {
      setError(`Максимальная сумма — ${maxAmount.toLocaleString("ru-RU")} ₽`);
      return;
    }
    if (settings && !settings.enabled) {
      setError("Пополнение временно отключено");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/payments/platega/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountRub: value, method }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      window.location.href = data.paymentUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
      setLoading(false);
    }
  }

  if (settings && !settings.enabled) {
    return (
      <div className="card p-8 text-center">
        <p className="text-[var(--color-text-secondary)]">Пополнение баланса временно недоступно.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div>
        {status === "success" && (
          <div className="mb-6 rounded-xl border border-[rgba(34,197,94,0.25)] bg-[rgba(34,197,94,0.08)] p-4 text-sm text-[var(--color-success)]">
            Платёж обрабатывается. Баланс обновится после подтверждения Platega.
          </div>
        )}
        {status === "failed" && (
          <div className="mb-6 rounded-xl border border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.08)] p-4 text-sm text-[var(--color-danger)]">
            Оплата не завершена. Попробуйте снова.
          </div>
        )}

        <h2 className="font-display text-xl font-semibold">Выберите сумму</h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          От {minAmount.toLocaleString("ru-RU")} до {maxAmount.toLocaleString("ru-RU")} ₽ · лимит{" "}
          {settings?.userDailyLimitRub.toLocaleString("ru-RU") ?? "50 000"} ₽ /{" "}
          {settings?.userDailyMaxCount ?? 10} пополнений в день
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {presets.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => {
                setAmountRub(v);
                setCustom("");
              }}
              className={cn(
                "rounded-xl border px-4 py-3 text-sm font-medium tabular-nums transition-colors",
                !custom && amountRub === v
                  ? "border-gold bg-[rgba(232,185,35,0.12)] text-gold"
                  : "border-[var(--color-border)] hover:border-[rgba(232,185,35,0.3)]"
              )}
            >
              {formatRub(v)}
            </button>
          ))}
        </div>

        <label className="mt-4 block">
          <span className="mb-2 block text-sm text-[var(--color-text-muted)]">Своя сумма (₽)</span>
          <input
            type="number"
            min={minAmount}
            max={maxAmount}
            step="50"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="Ввести сумму"
            className="max-w-xs"
          />
        </label>

        <h2 className="mt-10 font-display text-xl font-semibold">Способ оплаты</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {METHODS.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setMethod(m.key)}
              className={cn(
                "rounded-2xl border p-4 text-left transition-colors",
                method === m.key
                  ? "border-gold bg-[rgba(232,185,35,0.08)]"
                  : "border-[var(--color-border)] hover:border-[rgba(232,185,35,0.25)]"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">{m.title}</span>
                {m.badge && <span className="badge badge-gold text-[10px]">{m.badge}</span>}
              </div>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">{m.desc}</p>
              <p className="mt-2 text-[10px] text-[var(--color-text-muted)]">
                {PLATEGA_METHODS[m.key].label}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="card h-fit p-5">
        <h3 className="font-display text-lg font-semibold">Сводка платежа</h3>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--color-text-muted)]">На баланс</dt>
            <dd className="tabular-nums">{formatRub(selectedAmount || 0)}</dd>
          </div>
          {displayCurrency === "EUR" && (
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--color-text-muted)]">≈ в €</dt>
              <dd className="tabular-nums">{formatPrice(selectedAmount || 0)}</dd>
            </div>
          )}
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--color-text-muted)]">Комиссия</dt>
            <dd>{summary.feePercent}%</dd>
          </div>
          <div className="flex justify-between gap-3 border-t border-[var(--color-border)] pt-3">
            <dt className="text-[var(--color-text-muted)]">К оплате</dt>
            <dd className="tabular-nums font-semibold text-gold">
              {summary.payAmountRub.toFixed(2)} ₽
            </dd>
          </div>
        </dl>

        {error && (
          <p className="mt-4 text-sm text-[var(--color-danger)]" role="alert">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handlePay}
          disabled={loading}
          className="btn btn-primary mt-6 w-full py-3"
        >
          {loading ? "Создаём платёж..." : "Продолжить оплату"}
        </button>

        <p className="mt-3 text-center text-[11px] text-[var(--color-text-muted)]">
          Оплата через Platega.io
        </p>
      </div>
    </div>
  );
}
