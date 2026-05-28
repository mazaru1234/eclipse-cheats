"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { adminInputCls } from "@/components/admin/AdminPrimitives";

type Status = "idle" | "submitting" | "success" | "error";

interface SupportTicketFormProps {
  defaultName?: string;
  defaultEmail?: string;
  loggedIn?: boolean;
}

export function SupportTicketForm({
  defaultName = "",
  defaultEmail = "",
  loggedIn = false,
}: SupportTicketFormProps) {
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState<"low" | "normal" | "high" | "urgent">("normal");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [ticketNumber, setTicketNumber] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setStatus("submitting");

    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setError("Заполните все обязательные поля");
      setStatus("error");
      return;
    }
    if (message.trim().length < 10) {
      setError("Сообщение слишком короткое — опишите проблему подробнее");
      setStatus("error");
      return;
    }

    try {
      const res = await fetch("/api/support/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message, priority }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Не удалось отправить обращение");
        setStatus("error");
        return;
      }
      setTicketNumber(data.ticketNumber || "");
      setStatus("success");
      setSubject("");
      setMessage("");
      setPriority("normal");
    } catch {
      setError("Ошибка сети. Повторите попытку позже.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="card border-[rgba(34,197,94,0.25)] p-6">
        <h3 className="font-display text-xl font-bold text-[var(--color-success)]">Тикет создан</h3>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Ваше обращение принято. Номер тикета:
        </p>
        <div className="mt-4 rounded-xl border border-[rgba(232,185,35,0.3)] bg-[var(--color-bg-elevated)] px-4 py-3 text-center font-mono text-lg tracking-wider text-gold">
          {ticketNumber}
        </div>
        <p className="mt-4 text-xs text-[var(--color-text-muted)]">
          {loggedIn ? (
            <>
              Отслеживайте ответ в{" "}
              <Link href="/profile/tickets" className="text-gold hover:underline">
                личном кабинете
              </Link>
              .
            </>
          ) : (
            "Зарегистрируйтесь или войдите, чтобы видеть переписку в профиле."
          )}
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-4 text-sm text-gold hover:underline"
        >
          Создать ещё один тикет
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 p-6">
      {!loggedIn && (
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
              Имя *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              required
              className={adminInputCls}
              placeholder="Как к вам обращаться"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
              Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={120}
              required
              className={adminInputCls}
              placeholder="you@example.com"
            />
          </div>
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
          Тема *
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          maxLength={120}
          required
          className={adminInputCls}
          placeholder="Кратко, о чём вопрос"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
          Приоритет
        </label>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { v: "low", l: "Низкий" },
              { v: "normal", l: "Обычный" },
              { v: "high", l: "Высокий" },
              { v: "urgent", l: "Срочный" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.v}
              type="button"
              onClick={() => setPriority(opt.v)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                priority === opt.v
                  ? "border-gold bg-[rgba(232,185,35,0.12)] text-gold"
                  : "border-[var(--color-border)] text-[var(--color-text-muted)]"
              }`}
            >
              {opt.l}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
          Сообщение *
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={5000}
          rows={6}
          required
          className={`${adminInputCls} resize-y`}
          placeholder="Опишите проблему: что делали, что ожидали, номер заказа (если есть)."
        />
        <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">{message.length} / 5000</p>
      </div>

      {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <p className="text-[11px] text-[var(--color-text-muted)]">
          Отправляя форму, вы соглашаетесь с{" "}
          <Link href="/privacy" className="text-gold hover:underline">
            политикой конфиденциальности
          </Link>
          .
        </p>
        <button type="submit" disabled={status === "submitting"} className="btn btn-primary">
          {status === "submitting" ? "Отправка…" : "Отправить тикет"}
        </button>
      </div>
    </form>
  );
}
