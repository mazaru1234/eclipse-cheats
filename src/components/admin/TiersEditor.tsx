"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { PrimaryButton, adminInputCls } from "./AdminPrimitives";
import { formatCurrency } from "@/lib/utils";
import { formatDurationLabel, hasExternalUrl, TIER_PRESET_DAYS } from "@/lib/product-utils";

interface Tier {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  stockCount: number;
  isActive: boolean;
  externalUrl: string | null;
}

const SUGGESTED_DURATIONS = [...TIER_PRESET_DAYS];

function suggestDurationDays(existing: Tier[]): string {
  const used = new Set(existing.map((tier) => tier.durationDays));
  const next = SUGGESTED_DURATIONS.find((days) => !used.has(days));
  return next ? String(next) : "";
}

export function TiersEditor({ lineId }: { lineId: string }) {
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [newTier, setNewTier] = useState({ price: "", durationDays: "", name: "", externalUrl: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/tiers?lineId=${lineId}`);
      const data = await res.json();
      if (res.ok) setTiers(data.tiers ?? []);
    } finally {
      setLoading(false);
    }
  }, [lineId]);

  useEffect(() => {
    load();
  }, [load]);

  function openAddForm(currentTiers = tiers) {
    setError("");
    setNewTier({
      price: "",
      durationDays: suggestDurationDays(currentTiers),
      name: "",
      externalUrl: "",
    });
    setAdding(true);
  }

  async function createPresetTier(durationDays: number) {
    setError("");
    const res = await fetch("/api/admin/tiers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lineId, price: 0, durationDays }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Не удалось создать тариф");
      return;
    }
    setTiers((prev) => [...prev, data as Tier].sort((a, b) => a.durationDays - b.durationDays));
  }

  async function createTier() {
    setError("");
    if (!newTier.price || !newTier.durationDays) {
      setError("Укажите цену и количество дней");
      return;
    }

    const res = await fetch("/api/admin/tiers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lineId,
        price: Number(newTier.price),
        durationDays: Number(newTier.durationDays),
        name: newTier.name || undefined,
        externalUrl: newTier.externalUrl.trim() || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Не удалось создать тариф");
      return;
    }

    const nextTiers = [...tiers, data as Tier];
    setTiers(nextTiers);
    setNewTier({
      price: "",
      durationDays: suggestDurationDays(nextTiers),
      name: "",
      externalUrl: "",
    });
    setAdding(true);
  }

  async function updateField(
    tier: Tier,
    field: "name" | "price" | "durationDays" | "externalUrl",
    value: string | number | null
  ) {
    const res = await fetch(`/api/admin/tiers/${tier.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    const data = await res.json();
    if (res.ok) {
      setTiers((prev) => prev.map((item) => (item.id === tier.id ? data : item)));
    } else {
      alert(data.error || "Не удалось сохранить");
    }
  }

  async function deleteTier(id: string) {
    if (!confirm("Удалить тариф?")) return;
    const res = await fetch(`/api/admin/tiers/${id}`, { method: "DELETE" });
    if (res.ok) setTiers((prev) => prev.filter((item) => item.id !== id));
    else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Не удалось удалить");
    }
  }

  if (loading) return <p className="text-sm text-[var(--color-text-muted)]">Загрузка тарифов…</p>;

  return (
    <div>
      <div className="mb-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
          Быстрые тарифы
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTED_DURATIONS.map((days) => {
            const exists = tiers.some((tier) => tier.durationDays === days);
            return (
              <button
                key={days}
                type="button"
                disabled={exists}
                onClick={() => createPresetTier(days)}
                className={[
                  "rounded-lg border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors",
                  exists
                    ? "cursor-not-allowed border-[rgba(34,197,94,0.35)] bg-[rgba(34,197,94,0.1)] text-[var(--color-success)]"
                    : "border-[var(--color-border)] hover:border-gold hover:text-gold",
                ].join(" ")}
              >
                {formatDurationLabel(days)}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-[var(--color-text-muted)]">
          Нажмите срок — тариф создастся сразу. Цену, ссылку или ключи задайте ниже.
        </p>
      </div>

      {tiers.length === 0 && !adding && (
        <div className="rounded-xl border border-dashed border-[var(--color-border)] py-8 text-center">
          <p className="text-sm text-[var(--color-text-secondary)]">Нет тарифов — добавьте хотя бы один</p>
          <button type="button" onClick={() => openAddForm([])} className="mt-3 text-sm text-gold hover:underline">
            + Добавить первый тариф
          </button>
        </div>
      )}

      {tiers.length > 0 && (
        <div className="space-y-2">
          <div className="grid grid-cols-[1.1fr_0.9fr_0.7fr_0.7fr_2fr_auto] gap-2 px-1 text-[10px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
            <span>Название</span>
            <span>Цена (₽)</span>
            <span>Дней</span>
            <span>Ключи</span>
            <span>Внешняя ссылка</span>
            <span />
          </div>
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className="grid grid-cols-[1.1fr_0.9fr_0.7fr_0.7fr_2fr_auto] items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2"
            >
              <input
                type="text"
                defaultValue={tier.name}
                onBlur={(e) =>
                  e.target.value !== tier.name &&
                  e.target.value.trim() &&
                  updateField(tier, "name", e.target.value.trim())
                }
                className={adminInputCls}
              />
              <input
                type="number"
                step="0.01"
                defaultValue={tier.price}
                onBlur={(e) =>
                  Number(e.target.value) !== tier.price &&
                  updateField(tier, "price", Number(e.target.value))
                }
                className={adminInputCls}
              />
              <input
                type="number"
                defaultValue={tier.durationDays}
                onBlur={(e) =>
                  Number(e.target.value) !== tier.durationDays &&
                  updateField(tier, "durationDays", Number(e.target.value))
                }
                className={adminInputCls}
              />
              <span className="text-sm text-[var(--color-text-secondary)]">
                {hasExternalUrl(tier) ? "—" : tier.stockCount}
              </span>
              <input
                type="url"
                defaultValue={tier.externalUrl ?? ""}
                placeholder="https://… (пусто — ключ с баланса)"
                onBlur={(e) => {
                  const value = e.target.value.trim();
                  const next = value || null;
                  if (next !== (tier.externalUrl ?? null)) {
                    updateField(tier, "externalUrl", next);
                  }
                }}
                className={`${adminInputCls} font-mono text-xs`}
              />
              <button
                type="button"
                onClick={() => deleteTier(tier.id)}
                className="text-[var(--color-danger)]"
                aria-label="Удалить тариф"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {adding ? (
        <div className="mt-4 space-y-3 rounded-xl border border-[var(--color-border)] p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <input
              type="text"
              placeholder="Название (опционально)"
              value={newTier.name}
              onChange={(e) => setNewTier((prev) => ({ ...prev, name: e.target.value }))}
              className={adminInputCls}
            />
            <input
              type="number"
              step="0.01"
              placeholder="Цена, ₽"
              value={newTier.price}
              onChange={(e) => setNewTier((prev) => ({ ...prev, price: e.target.value }))}
              className={adminInputCls}
            />
            <input
              type="number"
              placeholder="Дней (уникально для товара)"
              value={newTier.durationDays}
              onChange={(e) => setNewTier((prev) => ({ ...prev, durationDays: e.target.value }))}
              className={adminInputCls}
            />
            <div className="flex gap-2">
              <PrimaryButton onClick={createTier}>Добавить</PrimaryButton>
              <button type="button" onClick={() => setAdding(false)} className="btn btn-ghost">
                Отмена
              </button>
            </div>
          </div>
          <input
            type="url"
            value={newTier.externalUrl}
            onChange={(e) => setNewTier((prev) => ({ ...prev, externalUrl: e.target.value }))}
            placeholder="Внешняя ссылка (необязательно) — https://… или t.me/…"
            className={adminInputCls}
          />
          <p className="text-xs text-[var(--color-text-muted)]">
            Если ссылка задана, кнопка «Купить» откроет партнёра или Telegram — ключи не нужны.
          </p>
          {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
        </div>
      ) : (
        tiers.length > 0 && (
          <button
            type="button"
            onClick={() => openAddForm()}
            className="mt-4 inline-flex items-center gap-2 text-sm text-gold"
          >
            <Plus className="h-4 w-4" />
            Добавить тариф
          </button>
        )
      )}

      {tiers.length > 0 && (
        <p className="mt-3 text-xs text-[var(--color-text-muted)]">
          Минимальная цена: {formatCurrency(Math.min(...tiers.map((tier) => tier.price)))} (в рублях)
        </p>
      )}
    </div>
  );
}
