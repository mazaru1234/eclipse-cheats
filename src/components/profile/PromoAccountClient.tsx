"use client";

import { useEffect, useState } from "react";
import { Check, Ticket, X } from "lucide-react";

interface ActivePromo {
  code: string;
  discountLabel: string;
  minOrderAmount: number;
}

interface HistoryItem {
  id: string;
  code: string;
  discountLabel: string;
  orderAmount: number;
  createdAt: string;
}

interface PromoAccountClientProps {
  history: HistoryItem[];
}

export function PromoAccountClient({ history }: PromoAccountClientProps) {
  const [code, setCode] = useState("");
  const [active, setActive] = useState<ActivePromo | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/profile/promo")
      .then((res) => res.json())
      .then((data) => setActive(data.active ?? null))
      .catch(() => setActive(null));
  }, []);

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/profile/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка активации");

      setActive(data.active);
      setCode("");
      setMessage(data.message || "Промокод активирован");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка активации");
    } finally {
      setLoading(false);
    }
  }

  async function handleClear() {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/profile/promo", { method: "DELETE" });
      if (!res.ok) throw new Error("Не удалось отключить промокод");
      setActive(null);
      setMessage("Промокод отключён");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="card p-5">
        <h2 className="font-display text-lg font-semibold">Активный промокод</h2>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Активируйте код здесь — скидка автоматически применится при покупке в каталоге.
        </p>

        {active ? (
          <div className="mt-5 rounded-xl border border-[rgba(232,185,35,0.25)] bg-[rgba(232,185,35,0.08)] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                  Скидка
                </p>
                <p className="mt-1 price-value price-value-md">{active.discountLabel}</p>
                <p className="mt-2 font-mono text-sm">{active.code}</p>
                {active.minOrderAmount > 0 && (
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    Мин. сумма заказа: {active.minOrderAmount.toLocaleString("ru-RU")} ₽
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={handleClear}
                disabled={loading}
                className="btn btn-ghost py-2 text-xs text-[var(--color-danger)]"
              >
                <X className="h-4 w-4" aria-hidden />
                Отключить
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleActivate} className="mt-5 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Ticket
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gold opacity-70"
                aria-hidden
              />
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="PROMO-2026"
                className="w-full py-2.5 pl-9 pr-3 text-sm"
                aria-label="Промокод"
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary shrink-0 px-5 py-2.5">
              {loading ? "Проверка…" : "Активировать"}
            </button>
          </form>
        )}

        {message && (
          <p className="mt-4 flex items-center gap-2 text-sm text-[var(--color-success)]">
            <Check className="h-4 w-4" aria-hidden />
            {message}
          </p>
        )}
        {error && (
          <p className="mt-4 text-sm text-[var(--color-danger)]" role="alert">
            {error}
          </p>
        )}
      </div>

      <div>
        <h2 className="font-display text-lg font-semibold">История использования</h2>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Промокоды, которые вы уже применили при покупках
        </p>
        <div className="card mt-4 table-wrap p-1">
          {history.length === 0 ? (
            <p className="p-5 text-[var(--color-text-secondary)]">Промокоды ещё не использовались.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Код</th>
                  <th>Скидка</th>
                  <th>Заказ</th>
                  <th>Дата</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id}>
                    <td className="font-mono text-gold">{item.code}</td>
                    <td>{item.discountLabel}</td>
                    <td>{item.orderAmount.toLocaleString("ru-RU")} ₽</td>
                    <td>{new Date(item.createdAt).toLocaleDateString("ru-RU")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
