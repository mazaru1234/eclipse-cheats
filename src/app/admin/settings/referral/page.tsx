"use client";

import { useEffect, useState } from "react";
import { PageHeader, FormSection, ToggleSwitch, PrimaryButton, adminInputCls } from "@/components/admin/AdminPrimitives";

type Settings = {
  enabled: boolean;
  friendDiscountType: "fixed" | "percent";
  friendDiscountRub: number;
  friendDiscountUsd: number;
  referrerBonusType: "fixed" | "percent";
  referrerBonusRub: number;
  referrerBonusUsd: number;
  dynamicRankBonus: boolean;
  recurrentBonus: boolean;
  monthlyReferralLimit: number;
  bonusValidityDays: number;
  payoutDelayDays: number;
  maxReferralsPerIP: number;
  blockedEmailDomains: string;
};

function TypeToggle({
  value,
  onChange,
}: {
  value: "fixed" | "percent";
  onChange: (value: "fixed" | "percent") => void;
}) {
  return (
    <div className="flex rounded-lg border border-[var(--color-border)] p-1">
      {(["fixed", "percent"] as const).map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => onChange(type)}
          className={[
            "flex-1 rounded py-1.5 text-xs font-bold transition-colors",
            value === type ? "bg-gold text-black" : "text-[var(--color-text-muted)]",
          ].join(" ")}
        >
          {type === "fixed" ? "Фикс." : "%"}
        </button>
      ))}
    </div>
  );
}

export default function ReferralSettingsPage() {
  const [form, setForm] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings/referral")
      .then((res) => res.json())
      .then((data) => setForm(data));
  }, []);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    setDirty(true);
    setMessage("");
  }

  async function save() {
    if (!form) return;
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/settings/referral", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Ошибка сохранения");
        return;
      }
      setForm(data);
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
        title="Реферальная программа"
        subtitle="Настройка бонусов, лимитов и антифрода"
        actions={
          <PrimaryButton onClick={save} disabled={saving || !dirty}>
            {saving ? "Сохранение…" : "Сохранить"}
          </PrimaryButton>
        }
      />

      {message && (
        <p className={`mb-4 text-sm ${message.includes("Ошибка") ? "text-[var(--color-danger)]" : "text-[var(--color-success)]"}`}>
          {message}
        </p>
      )}

      <div className="space-y-5">
        <FormSection title="Включить реферальную программу">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-[var(--color-text-secondary)]">
              Полностью включает или отключает реферальную систему на сайте.
            </p>
            <ToggleSwitch value={form.enabled} onChange={(value) => update("enabled", value)} />
          </div>
        </FormSection>

        <FormSection title="Скидка друга — первая покупка">
          <div className="grid gap-4 md:grid-cols-[160px_1fr_1fr]">
            <TypeToggle value={form.friendDiscountType} onChange={(value) => update("friendDiscountType", value)} />
            <label className="block">
              <span className="mb-1 block text-xs text-[var(--color-text-muted)]">RUB</span>
              <input
                type="number"
                value={form.friendDiscountRub}
                onChange={(e) => update("friendDiscountRub", Number(e.target.value))}
                className={adminInputCls}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-[var(--color-text-muted)]">USD</span>
              <input
                type="number"
                step="0.01"
                value={form.friendDiscountUsd}
                onChange={(e) => update("friendDiscountUsd", Number(e.target.value))}
                className={adminInputCls}
              />
            </label>
          </div>
        </FormSection>

        <FormSection title="Бонус приглашающего">
          <div className="grid gap-4 md:grid-cols-[160px_1fr_1fr]">
            <TypeToggle value={form.referrerBonusType} onChange={(value) => update("referrerBonusType", value)} />
            <label className="block">
              <span className="mb-1 block text-xs text-[var(--color-text-muted)]">RUB</span>
              <input
                type="number"
                value={form.referrerBonusRub}
                onChange={(e) => update("referrerBonusRub", Number(e.target.value))}
                className={adminInputCls}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-[var(--color-text-muted)]">
                {form.referrerBonusType === "percent" ? "Процент %" : "USD"}
              </span>
              <input
                type="number"
                step="0.01"
                value={form.referrerBonusUsd}
                onChange={(e) => update("referrerBonusUsd", Number(e.target.value))}
                className={adminInputCls}
              />
            </label>
          </div>
        </FormSection>

        <FormSection title="Дополнительные настройки">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">Динамический бонус по рангу</p>
                <p className="text-xs text-[var(--color-text-muted)]">Пока не реализовано</p>
              </div>
              <ToggleSwitch
                value={form.dynamicRankBonus}
                onChange={(value) => update("dynamicRankBonus", value)}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">Рекуррентный бонус</p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Начислять бонус за все покупки реферала, а не только первую
                </p>
              </div>
              <ToggleSwitch value={form.recurrentBonus} onChange={(value) => update("recurrentBonus", value)} />
            </div>
          </div>
        </FormSection>

        <FormSection title="Лимиты">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs text-[var(--color-text-muted)]">Лимит рефералов в месяц</span>
              <input
                type="number"
                value={form.monthlyReferralLimit}
                onChange={(e) => update("monthlyReferralLimit", Number(e.target.value))}
                className={adminInputCls}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-[var(--color-text-muted)]">Срок действия бонуса (дней)</span>
              <input
                type="number"
                value={form.bonusValidityDays}
                onChange={(e) => update("bonusValidityDays", Number(e.target.value))}
                className={adminInputCls}
              />
            </label>
          </div>
        </FormSection>
      </div>
    </div>
  );
}
