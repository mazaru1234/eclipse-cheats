"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PageHeader, StatCard, adminInputCls } from "@/components/admin/AdminPrimitives";

interface Ticket {
  id: string;
  ticketNumber: string;
  name: string;
  email: string;
  subject: string;
  status: string;
  priority: string;
  messageCount: number;
  lastReplyAt: string | Date | null;
  lastReplyBy: string | null;
  createdAt: string | Date;
  username: string | null;
}

interface Stats {
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
  total: number;
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  open: { label: "Открыт", color: "#22c55e" },
  in_progress: { label: "В работе", color: "#f59e0b" },
  resolved: { label: "Решён", color: "#67e8f9" },
  closed: { label: "Закрыт", color: "#6b7280" },
};

const PRIORITY_COLOR: Record<string, string> = {
  low: "#6b7280",
  normal: "#e8b923",
  high: "#f59e0b",
  urgent: "#ef4444",
};

function fmtDate(value: string | Date | null) {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return "только что";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} мин назад`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} ч назад`;
  return d.toLocaleDateString("ru-RU");
}

export function TicketsAdminClient({
  initialRows,
  initialStats,
}: {
  initialRows: Ticket[];
  initialStats: Stats;
}) {
  const [rows, setRows] = useState(initialRows);
  const [stats, setStats] = useState(initialStats);
  const [status, setStatus] = useState<"all" | "open" | "in_progress" | "resolved" | "closed">("open");
  const [search, setSearch] = useState("");

  const refresh = useCallback(async () => {
    const qs = new URLSearchParams();
    qs.set("status", status);
    if (search) qs.set("search", search);
    const res = await fetch(`/api/admin/tickets?${qs}`);
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

  return (
    <div>
      <PageHeader
        hideTitle
        title="Тикеты поддержки"
        subtitle="Обращения пользователей — чат, статусы, приоритеты"
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="Всего" value={stats.total} color="#ffffff" />
        <StatCard label="Открыты" value={stats.open} color="#22c55e" />
        <StatCard label="В работе" value={stats.in_progress} color="#f59e0b" />
        <StatCard label="Решены" value={stats.resolved} color="#67e8f9" />
        <StatCard label="Закрыты" value={stats.closed} color="#6b7280" />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(
          [
            ["open", `Открытые (${stats.open})`],
            ["in_progress", `В работе (${stats.in_progress})`],
            ["resolved", `Решённые (${stats.resolved})`],
            ["closed", `Закрытые (${stats.closed})`],
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
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по номеру, email, теме…"
          className={`${adminInputCls} ml-auto min-w-[220px] max-w-sm`}
        />
      </div>

      <div className="card table-wrap p-1">
        {rows.length === 0 ? (
          <p className="p-6 text-sm text-[var(--color-text-secondary)]">Тикетов не найдено.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Тикет</th>
                <th>Клиент</th>
                <th>Тема</th>
                <th>Статус</th>
                <th>Приоритет</th>
                <th>Сообщений</th>
                <th>Обновлён</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const statusMeta = STATUS_META[row.status] || STATUS_META.open;
                return (
                  <tr key={row.id}>
                    <td>
                      <Link href={`/admin/tickets/${row.id}`} className="font-mono text-sm text-gold hover:underline">
                        #{row.ticketNumber}
                      </Link>
                    </td>
                    <td>
                      <div className="text-sm">{row.username || row.name}</div>
                      <div className="text-xs text-[var(--color-text-muted)]">{row.email}</div>
                    </td>
                    <td className="max-w-[220px] truncate">{row.subject}</td>
                    <td>
                      <span
                        className="badge"
                        style={{ color: statusMeta.color, borderColor: `${statusMeta.color}44` }}
                      >
                        {statusMeta.label}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: PRIORITY_COLOR[row.priority] || "#e8b923" }}>
                        {row.priority}
                      </span>
                    </td>
                    <td>{row.messageCount}</td>
                    <td className="text-xs text-[var(--color-text-muted)]">
                      {fmtDate(row.lastReplyAt || row.createdAt)}
                      {row.lastReplyBy === "admin" && " · ждёт ответа пользователя"}
                      {row.lastReplyBy === "user" && " · ждёт ответа"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
