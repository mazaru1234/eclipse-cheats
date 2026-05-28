"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  PageHeader,
  FormSection,
  ToggleSwitch,
  PrimaryButton,
  adminInputCls,
} from "@/components/admin/AdminPrimitives";
import type { SafeTopupSettings } from "@/lib/services/topup-settings";

export default function TopupSettingsPage() {
  const [form, setForm] = useState<SafeTopupSettings | null>(null);
  const [presetsText, setPresetsText] = useState("");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings/topup")
      .then((res) => res.json())
      .then((data: SafeTopupSettings) => {
        setForm(data);
        setPresetsText(data.presetAmounts.join(", "));
      });
  }, []);

  function update<K extends keyof SafeTopupSettings>(key: K, value: SafeTopupSettings[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    setDirty(true);
    setMessage("");
  }

  async function save() {
    if (!form) return;
    setSaving(true);
    setMessage("");

    const presetAmounts = presetsText
      .split(/[,;\s]+/)
      .map((v) => Number(v.trim()))
      .filter((n) => Number.isFinite(n) && n > 0);

    if (presetAmounts.length === 0) {
      setMessage("Ошибка: укажите хотя бы один пресет суммы");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/settings/topup", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, presetAmounts }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Ошибка сохранения");
        return;
      }
      setForm(data);
      setPresetsText(data.presetAmounts.join(", "));
      setDirty(false);
      setMessage("Настройки сохранены");
    } finally {
      setSaving(false);
    }
  }

  if (!form) {
    return <p className="text-sm text-[var(--color-text-secondary)]">Загрузка…</p>;
  }

  return (
    <div>
      <PageHeader
        hideTitle
        title="Настройки пополнения"
        subtitle="Лимиты Platega, комиссия, пресеты сумм и лимиты админа"
        actions={
          <div className="flex gap-2">
            <Link href="/admin/deposits" className="btn btn-ghost py-2 text-sm">
              ← Пополнения
            </Link>
            <PrimaryButton onClick={save} disabled={saving || !dirty}>
              {saving ? "Сохранение…" : "Сохранить"}
            </PrimaryButton>
          </div>
        }
      />

      {message && (
        <p
          className={`mb-4 text-sm ${
            message.includes("Ошибка") ? "text-[var(--color-danger)]" : "text-[var(--color-success)]"
          }`}
        >
          {message}
        </p>
      )}

      <div className="space-y-5">
        <FormSection title="Пополнение через Platega">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-[var(--color-text-secondary)]">
              Разрешить пользователям пополнять баланс через платёжку
            </p>
            <ToggleSwitch value={form.enabled} onChange={(v) => update("enabled", v)} />
          </div>
        </FormSection>

        <FormSection title="Суммы и комиссия">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-xs text-[var(--color-text-muted)]">Минимум (₽)</span>
              <input
                type="number"
                value={form.minAmountRub}
                onChange={(e) => update("minAmountRub", Number(e.target.value))}
                className={adminInputCls}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-[var(--color-text-muted)]">Максимум (₽)</span>
              <input
                type="number"
                value={form.maxAmountRub}
                onChange={(e) => update("maxAmountRub", Number(e.target.value))}
                className={adminInputCls}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-[var(--color-text-muted)]">Комиссия (%)</span>
              <input
                type="number"
                step="0.1"
                value={form.feePercent}
                onChange={(e) => update("feePercent", Number(e.target.value))}
                className={adminInputCls}
              />
            </label>
          </div>
          <label className="mt-4 block">
            <span className="mb-1 block text-xs text-[var(--color-text-muted)]">
              Пресеты сумм (через запятую)
            </span>
            <input
              value={presetsText}
              onChange={(e) => {
                setPresetsText(e.target.value);
                setDirty(true);
              }}
              placeholder="500, 1000, 2500, 5000, 10000"
              className={adminInputCls}
            />
          </label>
        </FormSection>

        <FormSection title="Лимиты пользователя (в день)">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs text-[var(--color-text-muted)]">Макс. сумма (₽)</span>
              <input
                type="number"
                value={form.userDailyLimitRub}
                onChange={(e) => update("userDailyLimitRub", Number(e.target.value))}
                className={adminInputCls}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-[var(--color-text-muted)]">Макс. пополнений (шт.)</span>
              <input
                type="number"
                value={form.userDailyMaxCount}
                onChange={(e) => update("userDailyMaxCount", Number(e.target.value))}
                className={adminInputCls}
              />
            </label>
          </div>
        </FormSection>

        <FormSection title="Лимиты ручного пополнения (админ)">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs text-[var(--color-text-muted)]">Макс. за операцию (₽)</span>
              <input
                type="number"
                value={form.adminManualMaxRub}
                onChange={(e) => update("adminManualMaxRub", Number(e.target.value))}
                className={adminInputCls}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-[var(--color-text-muted)]">Макс. в день всего (₽)</span>
              <input
                type="number"
                value={form.adminDailyLimitRub}
                onChange={(e) => update("adminDailyLimitRub", Number(e.target.value))}
                className={adminInputCls}
              />
            </label>
          </div>
        </FormSection>
      </div>
    </div>
  );
}
