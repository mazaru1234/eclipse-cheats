"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { adminInputCls } from "@/components/admin/AdminPrimitives";

interface Ticket {
  ticketNumber: string;
  subject: string;
  status: string;
  createdAt: string | Date;
}

interface Message {
  id: string;
  role: string;
  authorName: string;
  body: string;
  createdAt: string | Date;
}

const STATUS_META: Record<string, { label: string; className: string }> = {
  open: { label: "Открыт", className: "badge badge-success" },
  in_progress: { label: "В работе", className: "badge badge-gold" },
  resolved: { label: "Решён", className: "badge border-[rgba(0,212,255,0.3)] bg-[rgba(0,212,255,0.08)] text-[#67e8f9]" },
  closed: { label: "Закрыт", className: "badge border-[var(--color-border)] bg-[var(--color-bg-elevated)]" },
};

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

export function UserTicketChat({
  ticket,
  initialMessages,
}: {
  ticket: Ticket;
  initialMessages: Message[];
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

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    setError("");
    const text = body.trim();
    if (!text) return;

    setSending(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.ticketNumber}`, {
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

  async function markResolved() {
    if (!confirm("Пометить тикет как решённый?")) return;
    const res = await fetch(`/api/tickets/${ticket.ticketNumber}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "resolved" }),
    });
    if (res.ok) {
      setStatus("resolved");
      router.refresh();
    }
  }

  const meta = STATUS_META[status] || STATUS_META.open;
  const canReply = status !== "closed";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/profile/tickets" className="text-sm text-[var(--color-text-muted)] hover:text-gold">
          ← К списку тикетов
        </Link>
        {status !== "resolved" && status !== "closed" && (
          <button type="button" onClick={markResolved} className="btn btn-ghost py-2 text-xs">
            Проблема решена
          </button>
        )}
      </div>

      <div className="card p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm text-gold">#{ticket.ticketNumber}</span>
          <span className={meta.className}>{meta.label}</span>
        </div>
        <h1 className="mt-2 font-display text-2xl font-bold">{ticket.subject}</h1>
      </div>

      <div className="card overflow-hidden">
        <div className="max-h-[480px] space-y-4 overflow-y-auto p-5">
          {messages.map((message) => {
            const isUser = message.role === "user";
            const isSystem = message.role === "system";
            return (
              <div
                key={message.id}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    isSystem
                      ? "border border-dashed border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-center text-xs text-[var(--color-text-muted)]"
                      : isUser
                        ? "bg-[rgba(232,185,35,0.12)] text-[var(--color-text)]"
                        : "border border-[var(--color-border)] bg-[var(--color-bg-elevated)]"
                  }`}
                >
                  {!isSystem && (
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                      {message.authorName}
                      {message.role === "admin" ? " · Поддержка" : ""}
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

        {canReply ? (
          <form onSubmit={handleSend} className="border-t border-[var(--color-border)] p-4">
            <textarea
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Напишите сообщение…"
              className={`${adminInputCls} resize-none`}
            />
            {error && <p className="mt-2 text-xs text-[var(--color-danger)]">{error}</p>}
            <div className="mt-3 flex justify-end">
              <button type="submit" disabled={sending || !body.trim()} className="btn btn-primary">
                {sending ? "Отправка…" : "Отправить"}
              </button>
            </div>
          </form>
        ) : (
          <div className="border-t border-[var(--color-border)] p-4 text-sm text-[var(--color-text-muted)]">
            Тикет закрыт. Создайте новое обращение, если нужна помощь.
          </div>
        )}
      </div>
    </div>
  );
}
