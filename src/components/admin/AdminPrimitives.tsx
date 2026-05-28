"use client";

import { ReactNode } from "react";
import Link from "next/link";

export const adminInputCls =
  "w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-4 py-2.5 text-sm text-[var(--color-text)]";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
  /** Скрыть h2 — заголовок уже есть в breadcrumb админки */
  hideTitle?: boolean;
}

export function PageHeader({
  title,
  subtitle,
  backHref,
  backLabel,
  actions,
  hideTitle = false,
}: PageHeaderProps) {
  return (
    <div className="mb-6">
      {backHref && (
        <Link
          href={backHref}
          className="mb-3 inline-flex min-h-[44px] items-center gap-1.5 text-xs text-[var(--color-text-muted)] transition-colors hover:text-gold"
        >
          ← {backLabel ?? "Назад"}
        </Link>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          {!hideTitle ? (
            <>
              <h2 className="font-display text-2xl font-bold tracking-wide md:text-3xl">{title}</h2>
              {subtitle && <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{subtitle}</p>}
            </>
          ) : (
            subtitle && <p className="text-sm text-[var(--color-text-secondary)]">{subtitle}</p>
          )}
        </div>
        {actions}
      </div>
    </div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} className="btn btn-primary">
      {children}
    </button>
  );
}

export function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="admin-stat-card">
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-40"
        style={{ background: `radial-gradient(circle, ${color}33 0%, transparent 70%)` }}
      />
      <p className="relative text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
        {label}
      </p>
      <div className="relative mt-3 flex items-center gap-3">
        <span className="h-2 w-2 rounded-full" style={{ background: color, boxShadow: `0 0 10px ${color}` }} />
        <span className="font-display text-3xl font-bold tabular-nums" style={{ color }}>
          {value}
        </span>
      </div>
    </div>
  );
}

export function FormSection({
  title,
  description,
  children,
  right,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <section className="admin-panel p-5 md:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold">{title}</h2>
          {description && <p className="mt-1 text-xs text-[var(--color-text-muted)]">{description}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

export function ToggleSwitch({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      aria-pressed={value}
      aria-label={label}
      className={[
        "relative h-6 w-11 shrink-0 rounded-full transition-colors",
        value ? "bg-gold" : "bg-[var(--color-bg-elevated)] border border-[var(--color-border)]",
      ].join(" ")}
    >
      <span
        className={[
          "absolute top-1 h-4 w-4 rounded-full bg-white transition-all",
          value ? "left-6" : "left-1",
        ].join(" ")}
      />
    </button>
  );
}

export function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">
        {label}
        {required && <span className="text-gold"> *</span>}
      </span>
      {children}
      {hint && <span className="block text-xs text-[var(--color-text-muted)]">{hint}</span>}
    </label>
  );
}

export function GhostButton({
  children,
  onClick,
  disabled,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} className="btn btn-ghost">
      {children}
    </button>
  );
}

export function ActionsSidebar({
  onSave,
  onDelete,
  saving,
  error,
  isEdit,
}: {
  onSave: () => void;
  onDelete?: () => void;
  saving: boolean;
  error?: string;
  isEdit?: boolean;
}) {
  return (
    <aside className="admin-panel h-fit space-y-4 p-5 lg:sticky lg:top-24">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
          Действия
        </p>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          {isEdit ? "Сохраните изменения или удалите запись." : "Заполните форму и сохраните."}
        </p>
      </div>
      {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
      <PrimaryButton onClick={onSave} disabled={saving}>
        {saving ? "Сохранение…" : "Сохранить"}
      </PrimaryButton>
      {isEdit && onDelete && (
        <GhostButton onClick={onDelete}>
          <span className="text-[var(--color-danger)]">Удалить</span>
        </GhostButton>
      )}
    </aside>
  );
}
