"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Tag } from "lucide-react";
import { PageHeader, PrimaryButton, StatCard, adminInputCls } from "./AdminPrimitives";
import { formatCurrency } from "@/lib/utils";
import type { AdminPromoCodeRow } from "@/lib/services/admin-promo";

const TYPE_META: Record<
  AdminPromoCodeRow["discountType"],
  { label: string; suffix: string; color: string }
> = {
  percent: { label: "Скидка %", suffix: "%", color: "#a855f7" },
  fixed: { label: "Фикс. скидка", suffix: "", color: "#e8b923" },
};

function fmtDate(value: Date | null): string {
  if (!value) return "—";
  return value.toLocaleDateString("ru-RU");
}

function promoStatus(p: AdminPromoCodeRow) {
  const isExpired = p.expiresAt && p.expiresAt < new Date();
  const isExhausted = p.maxUses != null && p.usedCount >= p.maxUses;
  if (!p.isActive) return { label: "Выключен", tone: "muted" as const };
  if (isExpired) return { label: "Истёк", tone: "danger" as const };
  if (isExhausted) return { label: "Лимит", tone: "warning" as const };
  return { label: "Активен", tone: "success" as const };
}

export function PromoCodesAdminClient({ initial }: { initial: AdminPromoCodeRow[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(true);

  const visible = useMemo(() => {
    let rows = [...items];
    if (!showInactive) rows = rows.filter((item) => item.isActive);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter((item) => item.code.toLowerCase().includes(q));
    }
    return rows;
  }, [items, search, showInactive]);

  const totalUses = items.reduce((sum, item) => sum + item.usedCount, 0);
  const activeCount = items.filter((item) => item.isActive).length;
  const exhaustedCount = items.filter((item) => {
    const expired = item.expiresAt && item.expiresAt < new Date();
    const limit = item.maxUses != null && item.usedCount >= item.maxUses;
    return expired || limit;
  }).length;

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Удалить промокод?")) return;
    const res = await fetch(`/api/admin/promo-codes?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Не удалось удалить");
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
    router.refresh();
  }

  async function handleToggle(e: React.MouseEvent, item: AdminPromoCodeRow) {
    e.preventDefault();
    e.stopPropagation();
    const res = await fetch("/api/admin/promo-codes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, isActive: !item.isActive }),
    });
    if (!res.ok) {
      alert("Не удалось изменить статус");
      return;
    }
    setItems((prev) =>
      prev.map((row) => (row.id === item.id ? { ...row, isActive: !row.isActive } : row))
    );
    router.refresh();
  }

  return (
    <div>
      <PageHeader
        hideTitle
        title="Промокоды"
        subtitle="Скидки, лимиты использований и минимальная сумма заказа"
        actions={
          <Link href="/admin/promo-codes/new">
            <PrimaryButton>
              <span className="inline-flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Создать промокод
              </span>
            </PrimaryButton>
          </Link>
        }
      />

      <div className="admin-stat-grid mb-6">
        <StatCard label="Всего" value={items.length} color="#e8b923" />
        <StatCard label="Активных" value={activeCount} color="#22c55e" />
        <StatCard label="Использований" value={totalUses} color="#ffffff" />
        <StatCard label="Исчерпано" value={exhaustedCount} color="#71717a" />
      </div>

      <div className="admin-panel mb-5 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по коду"
              className={`${adminInputCls} pl-10`}
            />
          </div>
          <label className="flex min-h-[44px] shrink-0 items-center gap-2 text-sm text-[var(--color-text-secondary)]">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
            />
            Показывать неактивные
          </label>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="admin-panel py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(232,185,35,0.1)] ring-1 ring-[rgba(232,185,35,0.2)]">
            <Tag className="h-6 w-6 text-gold" aria-hidden />
          </div>
          <p className="font-display text-lg font-bold">Промокодов пока нет</p>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Создайте первый код для акций и скидок
          </p>
          <Link href="/admin/promo-codes/new" className="mt-5 inline-block">
            <PrimaryButton>
              <span className="inline-flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Создать первый промокод
              </span>
            </PrimaryButton>
          </Link>
        </div>
      ) : visible.length === 0 ? (
        <div className="admin-panel py-16 text-center text-sm text-[var(--color-text-secondary)]">
          Промокоды не найдены
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((item) => {
            const typeMeta = TYPE_META[item.discountType];
            const status = promoStatus(item);
            const usageLimit = item.maxUses;
            const usagePercent = usageLimit ? Math.min(100, (item.usedCount / usageLimit) * 100) : 0;
            const valueLabel =
              item.discountType === "percent"
                ? `${item.discountValue}%`
                : formatCurrency(item.discountValue);

            return (
              <Link
                key={item.id}
                href={`/admin/promo-codes/${item.id}?from=${encodeURIComponent("/admin/promo-codes")}`}
                className="admin-panel group relative block overflow-hidden p-5 transition-all hover:-translate-y-0.5 hover:border-[rgba(232,185,35,0.25)]"
                style={{ opacity: item.isActive ? 1 : 0.7 }}
              >
                <div
                  className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full"
                  style={{
                    background: `radial-gradient(circle, ${typeMeta.color}22 0%, transparent 70%)`,
                  }}
                />

                <div className="relative mb-3 flex items-start justify-between gap-2">
                  <span
                    className="rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider"
                    style={{ background: `${typeMeta.color}22`, color: typeMeta.color }}
                  >
                    {typeMeta.label}
                  </span>
                  <span
                    className={`badge ${
                      status.tone === "success"
                        ? "badge-success"
                        : status.tone === "danger"
                          ? ""
                          : ""
                    }`}
                    style={
                      status.tone === "danger"
                        ? { background: "rgba(239,68,68,0.12)", color: "#fca5a5" }
                        : status.tone === "warning"
                          ? { background: "rgba(245,158,11,0.12)", color: "#fcd34d" }
                          : status.tone === "muted"
                            ? { background: "rgba(255,255,255,0.05)", color: "var(--color-text-muted)" }
                            : undefined
                    }
                  >
                    {status.label}
                  </span>
                </div>

                <p className="relative font-mono text-lg font-black tracking-wider">{item.code}</p>
                <p className="relative mt-2 font-display text-2xl font-bold" style={{ color: typeMeta.color }}>
                  {valueLabel}
                </p>

                <div className="relative mt-4 space-y-2 text-[11px] text-[var(--color-text-muted)]">
                  <div className="flex justify-between gap-2">
                    <span>Использовано</span>
                    <span className="tabular-nums text-[var(--color-text-secondary)]">
                      {item.usedCount}
                      {usageLimit != null ? ` / ${usageLimit}` : ""}
                    </span>
                  </div>
                  {usageLimit != null && (
                    <div className="h-1 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full transition-all"
                        style={{ width: `${usagePercent}%`, background: typeMeta.color }}
                      />
                    </div>
                  )}
                  <div className="flex justify-between gap-2">
                    <span>Мин. заказ</span>
                    <span className="text-[var(--color-text-secondary)]">
                      {item.minOrderAmount > 0 ? formatCurrency(item.minOrderAmount) : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span>Действует до</span>
                    <span className="text-[var(--color-text-secondary)]">{fmtDate(item.expiresAt)}</span>
                  </div>
                </div>

                <div className="relative mt-4 flex items-center gap-3 border-t border-[var(--color-border)] pt-3">
                  <span className="flex-1 text-[11px] text-gold opacity-0 transition-opacity group-hover:opacity-100">
                    Изменить →
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleToggle(e, item)}
                    className="text-[11px] text-[var(--color-text-muted)] hover:text-gold"
                  >
                    {item.isActive ? "Выкл" : "Вкл"}
                  </button>
                  <span className="text-[var(--color-border-strong)]">·</span>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, item.id)}
                    className="text-[11px] text-[var(--color-danger)] hover:opacity-80"
                  >
                    Удалить
                  </button>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
