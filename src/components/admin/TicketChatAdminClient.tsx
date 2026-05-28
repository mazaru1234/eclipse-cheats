"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { adminInputCls } from "@/components/admin/AdminPrimitives";
import { formatCurrency } from "@/lib/utils";

interface Ticket {
  id: string;
  ticketNumber: string;
  name: string;
  email: string;
  subject: string;
  status: string;
  priority: string;
  message: string;
  createdAt: string | Date;
}

interface Message {
  id: string;
  role: string;
  authorName: string;
  body: string;
  createdAt: string | Date;
}

interface UserContext {
  id: string;
  username: string;
  email: string;
  balance: number;
  createdAt: string | Date;
}

const STATUSES = [
  { value: "open", label: "Открыт" },
  { value: "in_progress", label: "В работе" },
  { value: "resolved", label: "Решён" },
  { value: "closed", label: "Закрыт" },
] as const;

function fmtTime(value: string | Date) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TicketChatAdminClient({
  ticket,
  initialMessages,
  user,
}: {
  ticket: Ticket;
  initialMessages: Message[];
  user: UserContext | null;
}) {
  const router = useRouter();
  const endRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState(initialMessages);
  const [status, setStatus] = useState(ticket.status);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  async function changeStatus(next: typeof status) {
    const res = await fetch(`/api/admin/tickets/${ticket.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (res.ok) {
      setStatus(next);
      router.refresh();
    }
  }

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    setError("");
    const text = body.trim();
    if (!text) return;

    setSending(true);
    try {
      const res = await fetch(`/api/admin/tickets/${ticket.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ошибка");
        return;
      }
      setMessages((prev) => [...prev, data.message]);
      setBody("");
      if (data.ticket?.status) setStatus(data.ticket.status);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_280px]">
      <div className="space-y-4">
        <Link href="/admin/tickets" className="text-sm text-[var(--color-text-muted)] hover:text-gold">
          ← К списку тикетов
        </Link>

        <div className="card p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm text-gold">#{ticket.ticketNumber}</span>
            <span className="badge badge-gold">{ticket.priority}</span>
          </div>
          <h1 className="mt-2 font-display text-2xl font-bold">{ticket.subject}</h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            {ticket.name} · {ticket.email}
          </p>
        </div>

        <div className="card overflow-hidden">
          <div className="max-h-[520px] space-y-4 overflow-y-auto p-5">
            {messages.map((message) => {
              const isAdmin = message.role === "admin";
              const isSystem = message.role === "system";
              return (
                <div key={message.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      isSystem
                        ? "border border-dashed border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-center text-xs text-[var(--color-text-muted)]"
                        : isAdmin
                          ? "bg-[rgba(232,185,35,0.12)]"
                          : "border border-[var(--color-border)] bg-[var(--color-bg-elevated)]"
                    }`}
                  >
                    {!isSystem && (
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                        {message.authorName}
                        {isAdmin ? " · Вы" : " · Клиент"}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.body}</p>
                    {!isSystem && (
                      <p className="mt-2 text-[10px] text-[var(--color-text-muted)]">
                        {fmtTime(message.createdAt)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>

          {status !== "closed" && (
            <form onSubmit={handleSend} className="border-t border-[var(--color-border)] p-4">
              <textarea
                rows={3}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Ответ клиенту…"
                className={`${adminInputCls} resize-none`}
              />
              {error && <p className="mt-2 text-xs text-[var(--color-danger)]">{error}</p>}
              <div className="mt-3 flex justify-end">
                <button type="submit" disabled={sending || !body.trim()} className="btn btn-primary">
                  {sending ? "Отправка…" : "Ответить"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <aside className="space-y-4">
        <div className="card p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Статус</p>
          <div className="mt-3 space-y-2">
            {STATUSES.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => changeStatus(item.value)}
                className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                  status === item.value
                    ? "border-gold bg-[rgba(232,185,35,0.12)] text-gold"
                    : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[rgba(232,185,35,0.25)]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {user && (
          <div className="card p-4 text-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Клиент</p>
            <p className="mt-3 font-medium">{user.username}</p>
            <p className="text-[var(--color-text-muted)]">{user.email}</p>
            <p className="mt-3">
              Баланс: <span className="text-gold">{formatCurrency(user.balance)}</span>
            </p>
            <Link href="/admin/users" className="mt-3 inline-block text-xs text-gold hover:underline">
              Открыть пользователей
            </Link>
          </div>
        )}

        <div className="card p-4 text-sm text-[var(--color-text-secondary)]">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">Первое сообщение</p>
          <p className="mt-3 whitespace-pre-wrap leading-relaxed">{ticket.message}</p>
        </div>
      </aside>
    </div>
  );
}
