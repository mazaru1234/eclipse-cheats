"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CreditCard,
  Search,
  Settings,
  User,
  Wallet,
  Zap,
} from "lucide-react";
import {
  PageHeader,
  PrimaryButton,
  StatCard,
  adminInputCls,
} from "./AdminPrimitives";
import { formatCurrency } from "@/lib/utils";
import type { SafeTopupSettings } from "@/lib/services/topup-settings";

interface UserOption {
  id: string;
  username: string;
  email: string;
  balance: number;
}

interface DepositRow {
  id: string;
  type: "platega" | "manual";
  userId: string;
  username: string;
  email: string;
  amountRub: number;
  payAmountRub: number | null;
  feePercent: number | null;
  status: string;
  description: string | null;
  createdAt: string;
  confirmedAt: string | null;
}

interface Stats {
  pending: number;
  confirmedToday: number;
  volumeTodayRub: number;
  manualTodayRub: number;
  totalConfirmed: number;
  totalVolumeRub: number;
}

const STATUS: Record<string, { label: string; className: string }> = {
  pending: { label: "Ожидание", className: "badge-warning" },
  confirmed: { label: "Зачислено", className: "badge-success" },
  canceled: { label: "Отменено", className: "badge-danger" },
};

function fmtDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DepositsAdminClient() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [settings, setSettings] = useState<SafeTopupSettings | null>(null);
  const [adminRemaining, setAdminRemaining] = useState(0);
  const [rows, setRows] = useState<DepositRow[]>([]);
  const [total, setTotal] = useState(0);

  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [userSearch, setUserSearch] = useState("");
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [amountRub, setAmountRub] = useState(0);
  const [customAmount, setCustomAmount] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const resolveUser = useCallback((): UserOption | undefined => {
    if (selectedUserId) {
      return users.find((u) => u.id === selectedUserId);
    }
    const q = userSearch.trim().toLowerCase();
    if (!q) return undefined;
    const exact = users.find(
      (u) => u.email.toLowerCase() === q || u.username.toLowerCase() === q
    );
    if (exact) return exact;
    if (users.length === 1) return users[0];
    return undefined;
  }, [selectedUserId, userSearch, users]);

  const selectedUser = resolveUser();
  const selectedAmount = customAmount ? Number(customAmount) : amountRub;
  const canSubmit = Boolean(selectedUser && selectedAmount > 0);

  const refresh = useCallback(async () => {
    const qs = new URLSearchParams();
    qs.set("status", statusFilter);
    if (search) qs.set("search", search);

    const [ctxRes, listRes] = await Promise.all([
      fetch("/api/admin/deposits?context=1"),
      fetch(`/api/admin/deposits?${qs}`),
    ]);

    if (ctxRes.ok) {
      const ctx = await ctxRes.json();
      setStats(ctx.stats);
      setSettings(ctx.settings);
      setAdminRemaining(ctx.adminRemainingTodayRub);
    }

    if (listRes.ok) {
      const data = await listRes.json();
      setRows(data.rows ?? []);
      setTotal(data.total ?? 0);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    const t = setTimeout(refresh, 250);
    return () => clearTimeout(t);
  }, [refresh]);

  useEffect(() => {
    const t = setTimeout(async () => {
      const res = await fetch(`/api/admin/deposits?users=${encodeURIComponent(userSearch)}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users ?? []);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [userSearch]);

  useEffect(() => {
    if (selectedUserId) return;
    const q = userSearch.trim().toLowerCase();
    if (!q || users.length === 0) return;

    const exact = users.find(
      (u) => u.email.toLowerCase() === q || u.username.toLowerCase() === q
    );
    const match = exact ?? (users.length === 1 ? users[0] : undefined);
    if (!match) return;

    setSelectedUserId(match.id);
  }, [users, userSearch, selectedUserId]);

  async function handleManualTopup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    const user = resolveUser();
    if (!user) {
      setError("Выберите пользователя из списка");
      return;
    }
    if (!selectedAmount || selectedAmount <= 0) {
      setError("Укажите сумму");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          amountRub: selectedAmount,
          description,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка");

      setMessage(`Зачислено ${formatCurrency(selectedAmount)} пользователю ${user.username}`);
      setSelectedUserId("");
      setUserSearch("");
      setCustomAmount("");
      setAmountRub(0);
      setDescription("");
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setSubmitting(false);
    }
  }

  const presets = useMemo(() => settings?.presetAmounts ?? [500, 1000, 2500, 5000], [settings]);

  return (
    <div>
      <PageHeader
        hideTitle
        title="Пополнения"
        subtitle="Platega, ручные зачисления, лимиты и история"
        actions={
          <Link href="/admin/settings/topup" className="btn btn-ghost inline-flex items-center gap-2 py-2 text-sm">
            <Settings className="h-4 w-4" />
            Настройки
          </Link>
        }
      />

      {stats && (
        <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <StatCard label="Ожидают" value={stats.pending} color="#f59e0b" />
          <StatCard label="Сегодня" value={stats.confirmedToday} color="#22c55e" />
          <StatCard label="Оборот сегодня" value={`${Math.round(stats.volumeTodayRub).toLocaleString("ru-RU")} ₽`} color="#e8b923" />
          <StatCard label="Ручные сегодня" value={`${Math.round(stats.manualTodayRub).toLocaleString("ru-RU")} ₽`} color="#67e8f9" />
          <StatCard label="Всего зачислено" value={stats.totalConfirmed} color="#ffffff" />
          <StatCard label="Общий оборот" value={`${Math.round(stats.totalVolumeRub).toLocaleString("ru-RU")} ₽`} color="#a855f7" />
        </div>
      )}

      <div className="mb-8 grid gap-6 xl:grid-cols-[1fr_340px]">
        <form onSubmit={handleManualTopup} className="card p-5">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <Wallet className="h-5 w-5 text-gold" aria-hidden />
            Ручное пополнение
          </h2>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Зачисление на баланс без Platega — для компенсаций и поддержки
          </p>

          <div className="mt-5">
            <label className="mb-1.5 block text-xs font-semibold text-[var(--color-text-muted)]">
              Пользователь
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gold opacity-70" />
              <input
                value={userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value);
                  setSelectedUserId("");
                }}
                placeholder="Поиск по email или нику…"
                className={`${adminInputCls} pl-9`}
              />
            </div>
            {users.length > 0 && !selectedUser && (
              <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-1">
                <p className="px-3 py-1.5 text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">
                  Выберите пользователя
                </p>
                {users.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => {
                      setSelectedUserId(user.id);
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-[var(--color-bg-card)]"
                  >
                    <span>
                      <span className="font-medium">{user.username}</span>
                      <span className="ml-2 text-xs text-[var(--color-text-muted)]">{user.email}</span>
                    </span>
                    <span className="text-xs tabular-nums text-gold">{formatCurrency(user.balance)}</span>
                  </button>
                ))}
              </div>
            )}
            {selectedUser && (
              <div className="mt-2 flex items-center justify-between rounded-xl border border-[rgba(232,185,35,0.35)] bg-[rgba(232,185,35,0.08)] px-3 py-2.5 text-sm">
                <div>
                  <span className="font-medium">{selectedUser.username}</span>
                  <span className="ml-2 text-xs text-[var(--color-text-muted)]">{selectedUser.email}</span>
                </div>
                <div className="text-right">
                  <div className="text-xs text-[var(--color-text-muted)]">Баланс</div>
                  <div className="font-semibold tabular-nums text-gold">{formatCurrency(selectedUser.balance)}</div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-xs font-semibold text-[var(--color-text-muted)]">Сумма</label>
            <div className="flex flex-wrap gap-2">
              {presets.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    setAmountRub(v);
                    setCustomAmount("");
                  }}
                  className={`rounded-xl border px-4 py-2.5 text-sm font-semibold tabular-nums transition-colors ${
                    !customAmount && amountRub === v
                      ? "border-gold bg-[rgba(232,185,35,0.12)] text-gold"
                      : "border-[var(--color-border)] hover:border-[rgba(232,185,35,0.3)]"
                  }`}
                >
                  {v.toLocaleString("ru-RU")} ₽
                </button>
              ))}
            </div>
            <input
              type="number"
              min="1"
              step="50"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="Своя сумма"
              className={`${adminInputCls} mt-3 max-w-xs`}
            />
          </div>

          <div className="mt-4">
            <label className="mb-1.5 block text-xs font-semibold text-[var(--color-text-muted)]">
              Комментарий (необязательно)
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Компенсация, бонус, тест…"
              className={adminInputCls}
            />
          </div>

          {error && <p className="mt-4 text-sm text-[var(--color-danger)]">{error}</p>}
          {message && <p className="mt-4 text-sm text-[var(--color-success)]">{message}</p>}

          <div className="mt-4">
            <PrimaryButton type="submit" disabled={submitting || !canSubmit}>
              {submitting ? "Зачисление…" : `Зачислить ${selectedAmount ? formatCurrency(selectedAmount) : ""}`}
            </PrimaryButton>
          </div>
        </form>

        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-display text-base font-semibold">Лимиты админа</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--color-text-muted)]">За операцию</dt>
                <dd className="font-semibold tabular-nums">
                  {settings ? `${settings.adminManualMaxRub.toLocaleString("ru-RU")} ₽` : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--color-text-muted)]">Осталось сегодня</dt>
                <dd className="font-semibold tabular-nums text-gold">
                  {Math.round(adminRemaining).toLocaleString("ru-RU")} ₽
                </dd>
              </div>
            </dl>
          </div>

          <div className="card p-5">
            <h3 className="flex items-center gap-2 font-display text-base font-semibold">
              <Zap className="h-4 w-4 text-gold" />
              Platega (пользователи)
            </h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--color-text-muted)]">Мин / макс</dt>
                <dd className="tabular-nums">
                  {settings
                    ? `${settings.minAmountRub} – ${settings.maxAmountRub.toLocaleString("ru-RU")} ₽`
                    : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--color-text-muted)]">Комиссия</dt>
                <dd>{settings ? `${settings.feePercent}%` : "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--color-text-muted)]">Лимит в день</dt>
                <dd className="tabular-nums">
                  {settings
                    ? `${settings.userDailyLimitRub.toLocaleString("ru-RU")} ₽ / ${settings.userDailyMaxCount} шт.`
                    : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--color-text-muted)]">Статус</dt>
                <dd>{settings?.enabled ? "Включено" : "Отключено"}</dd>
              </div>
            </dl>
          </div>

          <div className="card flex items-center gap-3 p-4 text-sm text-[var(--color-text-secondary)]">
            <CreditCard className="h-5 w-5 shrink-0 text-gold" />
            <p>Настройки лимитов, пресетов и комиссии — в разделе «Настройки».</p>
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`${adminInputCls} max-w-[180px]`}
        >
          <option value="all">Все статусы</option>
          <option value="pending">Ожидание</option>
          <option value="confirmed">Зачислено</option>
          <option value="canceled">Отменено</option>
        </select>
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по email, нику, ID…"
            className={`${adminInputCls} pl-10`}
          />
        </div>
      </div>

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Тип</th>
              <th>Пользователь</th>
              <th>На баланс</th>
              <th>К оплате</th>
              <th>Статус</th>
              <th>Дата</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const meta = STATUS[row.status] ?? { label: row.status, className: "badge" };
              return (
                <tr key={`${row.type}-${row.id}`}>
                  <td>
                    <span className={`badge ${row.type === "manual" ? "badge-gold" : ""}`}>
                      {row.type === "manual" ? "Ручное" : "Platega"}
                    </span>
                  </td>
                  <td>
                    <div className="font-medium">{row.username}</div>
                    <div className="text-xs text-[var(--color-text-muted)]">{row.email}</div>
                    {row.description && (
                      <div className="mt-1 text-[10px] text-[var(--color-text-muted)]">{row.description}</div>
                    )}
                  </td>
                  <td className="tabular-nums font-semibold text-gold">
                    {formatCurrency(row.amountRub)}
                  </td>
                  <td className="tabular-nums text-[var(--color-text-secondary)]">
                    {row.payAmountRub != null ? `${row.payAmountRub.toFixed(2)} ₽` : "—"}
                  </td>
                  <td>
                    <span className={`badge ${meta.className}`}>{meta.label}</span>
                  </td>
                  <td className="text-xs text-[var(--color-text-muted)]">
                    {fmtDate(row.confirmedAt ?? row.createdAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="py-10 text-center text-sm text-[var(--color-text-secondary)]">
            Пополнений не найдено
          </p>
        )}
        <p className="mt-4 px-4 pb-4 text-xs text-[var(--color-text-muted)]">
          Platega записей: {total} · в таблице также ручные зачисления
        </p>
      </div>
    </div>
  );
}
