"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, Eye, EyeOff, Search, Trash2, Upload } from "lucide-react";
import { PageHeader, PrimaryButton, StatCard, adminInputCls } from "./AdminPrimitives";
import { ImportKeysModal } from "./ImportKeysModal";
import type { KeyImportLine } from "@/lib/services/keys";

interface KeyRow {
  id: string;
  value: string;
  status: string;
  productId: string;
  productName: string;
  gameName: string;
  lineName: string | null;
  durationDays: number;
  orderId: string | null;
  createdAt: string;
  soldAt: string | null;
}

interface Stats {
  available: number;
  reserved: number;
  sold: number;
  expired: number;
  total: number;
}

const STATUS_META: Record<string, { label: string; className: string }> = {
  available: { label: "Доступен", className: "badge-success" },
  reserved: { label: "Резерв", className: "badge-warning" },
  sold: { label: "Продан", className: "badge-gold" },
};

function maskKey(value: string, reveal: boolean): string {
  if (reveal) return value;
  if (value.length <= 8) return "•".repeat(value.length);
  return value.slice(0, 4) + "•".repeat(Math.max(4, value.length - 8)) + value.slice(-4);
}

function fmtDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function KeysAdminClient() {
  const [stats, setStats] = useState<Stats>({
    available: 0,
    reserved: 0,
    sold: 0,
    expired: 0,
    total: 0,
  });
  const [keys, setKeys] = useState<KeyRow[]>([]);
  const [total, setTotal] = useState(0);
  const [lines, setLines] = useState<KeyImportLine[]>([]);
  const [lineFilter, setLineFilter] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest" | "status">("newest");
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(20);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [showImport, setShowImport] = useState(false);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (tierFilter) qs.set("productId", tierFilter);
      else if (lineFilter) qs.set("lineId", lineFilter);
      if (statusFilter) qs.set("status", statusFilter);
      if (sort) qs.set("sort", sort);
      if (search) qs.set("search", search);
      qs.set("limit", String(limit));

      const [keysRes, statsRes, linesRes] = await Promise.all([
        fetch(`/api/admin/keys?${qs}`),
        fetch("/api/admin/keys/stats"),
        fetch("/api/admin/keys?list=lines"),
      ]);

      const keysData = await keysRes.json();
      const statsData = await statsRes.json();
      const linesData = await linesRes.json();

      if (keysRes.ok) {
        setKeys(keysData.rows ?? []);
        setTotal(keysData.total ?? 0);
      }
      if (statsRes.ok) setStats(statsData);
      if (linesRes.ok) setLines(linesData.lines ?? []);
    } finally {
      setLoading(false);
    }
  }, [lineFilter, tierFilter, statusFilter, sort, search, limit]);

  const selectedLine = lines.find((line) => line.id === lineFilter);
  const tierOptions = selectedLine?.tiers ?? [];

  useEffect(() => {
    const timer = setTimeout(refresh, 300);
    return () => clearTimeout(timer);
  }, [refresh]);

  async function handleDelete(id: string) {
    if (!confirm("Удалить ключ?")) return;
    const res = await fetch(`/api/admin/keys?id=${id}`, { method: "DELETE" });
    if (res.ok) refresh();
    else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Не удалось удалить ключ");
    }
  }

  async function copyValue(value: string) {
    await navigator.clipboard.writeText(value);
  }

  return (
    <div>
      <PageHeader
        hideTitle
        title="Ключи"
        subtitle="Склад лицензионных ключей — импорт, статусы, привязки"
        actions={
          <PrimaryButton onClick={() => setShowImport(true)}>
            <span className="inline-flex items-center gap-2">
              <Upload className="h-4 w-4" aria-hidden />
              Импорт
            </span>
          </PrimaryButton>
        }
      />

      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="Доступно" value={stats.available} color="#22c55e" />
        <StatCard label="Зарезервировано" value={stats.reserved} color="#f59e0b" />
        <StatCard label="Продано" value={stats.sold} color="#e8b923" />
        <StatCard label="Истекло" value={stats.expired} color="#71717a" />
        <StatCard label="Всего" value={stats.total} color="#ffffff" />
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <select
          value={lineFilter}
          onChange={(e) => {
            setLineFilter(e.target.value);
            setTierFilter("");
          }}
          className={`${adminInputCls} max-w-[240px]`}
        >
          <option value="">Все товары</option>
          {lines.map((line) => (
            <option key={line.id} value={line.id}>
              {line.gameName} — {line.name}
            </option>
          ))}
        </select>

        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          disabled={!lineFilter}
          className={`${adminInputCls} max-w-[180px] disabled:opacity-50`}
        >
          <option value="">Все тарифы</option>
          {tierOptions.map((tier) => (
            <option key={tier.id} value={tier.id}>
              {tier.durationLabel}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`${adminInputCls} max-w-[180px]`}
        >
          <option value="">Все статусы</option>
          <option value="available">Доступен</option>
          <option value="reserved">Резерв</option>
          <option value="sold">Продан</option>
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className={`${adminInputCls} max-w-[180px]`}
        >
          <option value="newest">Сначала новые</option>
          <option value="oldest">Сначала старые</option>
          <option value="status">По статусу</option>
        </select>

        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск ключей"
            className={`${adminInputCls} pl-10`}
          />
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-3 py-2 text-xs text-[var(--color-text-muted)]">
          <span>Показать</span>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="bg-transparent font-bold text-[var(--color-text)] focus:outline-none"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span>ключей</span>
        </div>
      </div>

      <div className="card table-wrap">
        {loading && <p className="mb-3 text-xs text-[var(--color-text-muted)]">Обновление…</p>}
        <table>
          <thead>
            <tr>
              <th>Значение</th>
              <th>Товар</th>
              <th>Игра</th>
              <th>Тариф</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {keys.map((key) => {
              const meta = STATUS_META[key.status] ?? { label: key.status, className: "badge" };
              const isRevealed = revealed[key.id];

              return (
                <tr key={key.id}>
                  <td>
                    <div className="font-mono text-xs">{maskKey(key.value, isRevealed)}</div>
                    <div className="mt-1 text-[10px] text-[var(--color-text-muted)]">
                      #{key.id.slice(0, 6)} · создан {fmtDate(key.createdAt)}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setRevealed((prev) => ({ ...prev, [key.id]: !prev[key.id] }))}
                        className="inline-flex items-center gap-1 text-[10px] text-[var(--color-text-muted)] hover:text-gold"
                      >
                        {isRevealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        {isRevealed ? "скрыть" : "показать"}
                      </button>
                      <button
                        type="button"
                        onClick={() => copyValue(key.value)}
                        className="inline-flex items-center gap-1 text-[10px] text-[var(--color-text-muted)] hover:text-gold"
                      >
                        <Copy className="h-3 w-3" />
                        копировать
                      </button>
                    </div>
                  </td>
                  <td>{key.lineName ?? "—"}</td>
                  <td>{key.gameName}</td>
                  <td>{key.productName}</td>
                  <td>
                    <span className={`badge ${meta.className}`}>{meta.label}</span>
                  </td>
                  <td>
                    {key.status === "available" && (
                      <button
                        type="button"
                        onClick={() => handleDelete(key.id)}
                        className="inline-flex items-center gap-1 text-xs text-[var(--color-danger)] hover:underline"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Удалить
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {keys.length === 0 && (
          <p className="py-10 text-center text-sm text-[var(--color-text-secondary)]">Ключи не найдены</p>
        )}
        <p className="mt-4 text-xs text-[var(--color-text-muted)]">Всего записей: {total}</p>
      </div>

      {showImport && (
        <ImportKeysModal
          lines={lines}
          onClose={() => setShowImport(false)}
          onSuccess={() => {
            setShowImport(false);
            refresh();
          }}
        />
      )}
    </div>
  );
}
