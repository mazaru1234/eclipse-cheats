"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Star } from "lucide-react";
import { PageHeader, StatCard, adminInputCls } from "@/components/admin/AdminPrimitives";
import { ReviewStars } from "@/components/reviews/ReviewStars";

interface ReviewRow {
  id: string;
  rating: number;
  body: string;
  status: string;
  createdAt: string | Date;
  username: string;
  lineName: string;
  lineSlug: string;
  gameName: string;
  gameSlug: string;
}

interface Stats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending: { label: "На модерации", color: "#f59e0b" },
  approved: { label: "Одобрен", color: "#22c55e" },
  rejected: { label: "Отклонён", color: "#ef4444" },
};

function fmtDate(value: string | Date) {
  const d = value instanceof Date ? value : new Date(value);
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
}

export function ReviewsAdminClient({
  initialRows,
  initialStats,
}: {
  initialRows: ReviewRow[];
  initialStats: Stats;
}) {
  const [rows, setRows] = useState(initialRows);
  const [stats, setStats] = useState(initialStats);
  const [status, setStatus] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const qs = new URLSearchParams();
    qs.set("status", status);
    if (search) qs.set("search", search);
    const res = await fetch(`/api/admin/reviews?${qs}`);
    if (res.ok) {
      const data = await res.json();
      setRows(data.rows || []);
      if (data.stats) setStats(data.stats);
    }
  }, [status, search]);

  useEffect(() => {
    const t = setTimeout(refresh, 250);
    return () => clearTimeout(t);
  }, [refresh]);

  async function moderate(id: string, nextStatus: "approved" | "rejected") {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) await refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader hideTitle title="Отзывы" subtitle="Модерация отзывов покупателей" />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Всего" value={stats.total} color="#ffffff" />
        <StatCard label="На модерации" value={stats.pending} color="#f59e0b" />
        <StatCard label="Одобрены" value={stats.approved} color="#22c55e" />
        <StatCard label="Отклонены" value={stats.rejected} color="#ef4444" />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(
          [
            ["pending", `На модерации (${stats.pending})`],
            ["approved", `Одобрены (${stats.approved})`],
            ["rejected", `Отклонены (${stats.rejected})`],
            ["all", "Все"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setStatus(key)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              status === key
                ? "bg-[rgba(232,185,35,0.15)] text-gold"
                : "bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            {label}
          </button>
        ))}
        <input
          type="search"
          placeholder="Поиск по тексту, товару, пользователю…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${adminInputCls} ml-auto min-w-[220px] flex-1 md:max-w-sm`}
        />
      </div>

      <div className="space-y-3">
        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--color-border)] py-16 text-center text-[var(--color-text-muted)]">
            <Star className="mx-auto mb-3 h-8 w-8 opacity-50" />
            Отзывов не найдено
          </div>
        ) : (
          rows.map((row) => {
            const meta = STATUS_META[row.status] ?? STATUS_META.pending;
            return (
              <div key={row.id} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{row.username}</span>
                      <ReviewStars value={row.rating} readonly size="sm" />
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                        style={{ background: `${meta.color}22`, color: meta.color }}
                      >
                        {meta.label}
                      </span>
                    </div>
                    <Link
                      href={`/catalog/${row.gameSlug}/${row.lineSlug}`}
                      className="mt-1 inline-block text-sm text-gold hover:underline"
                    >
                      {row.lineName} · {row.gameName}
                    </Link>
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">{fmtDate(row.createdAt)}</p>
                  </div>

                  {row.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={busyId === row.id}
                        onClick={() => moderate(row.id, "approved")}
                        className="rounded-lg bg-green-500/15 px-3 py-1.5 text-xs font-semibold text-green-400 hover:bg-green-500/25"
                      >
                        Одобрить
                      </button>
                      <button
                        type="button"
                        disabled={busyId === row.id}
                        onClick={() => moderate(row.id, "rejected")}
                        className="rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/25"
                      >
                        Отклонить
                      </button>
                    </div>
                  )}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">{row.body}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
