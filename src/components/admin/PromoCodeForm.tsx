"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ActionsSidebar,
  Field,
  FormSection,
  PageHeader,
  ToggleSwitch,
  adminInputCls,
} from "./AdminPrimitives";
import type { AdminPromoCodeRow } from "@/lib/services/admin-promo";

export interface PromoCodeFormData {
  id?: string;
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  maxUses: number | null;
  minOrderAmount: number;
  expiresAt: string;
  isActive: boolean;
}

function safeBackHref(raw: string | null) {
  if (!raw) return "/admin/promo-codes";
  return raw.startsWith("/admin/") ? raw : "/admin/promo-codes";
}

function toDateInput(value: Date | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function rowToForm(row: AdminPromoCodeRow): PromoCodeFormData {
  return {
    id: row.id,
    code: row.code,
    discountType: row.discountType,
    discountValue: row.discountValue,
    maxUses: row.maxUses,
    minOrderAmount: row.minOrderAmount,
    expiresAt: toDateInput(row.expiresAt),
    isActive: row.isActive,
  };
}

export function PromoCodeForm({ initial }: { initial?: AdminPromoCodeRow }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const backHref = safeBackHref(searchParams.get("from"));
  const isEdit = !!initial?.id;

  const [form, setForm] = useState<PromoCodeFormData>(
    initial
      ? rowToForm(initial)
      : {
          code: "",
          discountType: "percent",
          discountValue: 10,
          maxUses: 100,
          minOrderAmount: 0,
          expiresAt: "",
          isActive: true,
        }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const valueLabel =
    form.discountType === "percent" ? "Значение (%)" : "Скидка (₽)";

  async function handleSave() {
    setError("");
    if (!form.code.trim()) {
      setError("Укажите код промокода");
      return;
    }
    if (!(form.discountValue > 0)) {
      setError("Значение должно быть больше 0");
      return;
    }
    if (form.discountType === "percent" && form.discountValue > 100) {
      setError("Процент не может быть больше 100");
      return;
    }

    setSaving(true);
    const payload = {
      code: form.code.trim().toUpperCase(),
      discountType: form.discountType,
      discountValue: form.discountValue,
      maxUses: form.maxUses,
      minOrderAmount: form.minOrderAmount,
      expiresAt: form.expiresAt ? new Date(`${form.expiresAt}T23:59:59`).toISOString() : null,
      isActive: form.isActive,
    };

    try {
      const res = isEdit
        ? await fetch("/api/admin/promo-codes", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: initial!.id, ...payload }),
          })
        : await fetch("/api/admin/promo-codes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Ошибка сохранения");
        return;
      }

      router.push(backHref);
      router.refresh();
    } catch {
      setError("Ошибка сети");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!isEdit || !confirm("Удалить промокод?")) return;
    const res = await fetch(`/api/admin/promo-codes?id=${initial!.id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Не удалось удалить");
      return;
    }
    router.push(backHref);
    router.refresh();
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? "Редактировать промокод" : "Создание промокода"}
        subtitle="Настройте код, тип скидки и ограничения"
        backHref={backHref}
        backLabel="Назад к промокодам"
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-5">
          <FormSection title="Код и значение" description="Код сохраняется в верхнем регистре">
            <div className="space-y-4">
              <Field label="Код" required hint="Латиница и цифры, например SUMMER2026">
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="SUMMER2026"
                  className={`${adminInputCls} font-mono text-lg tracking-wider`}
                />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Тип скидки">
                  <select
                    value={form.discountType}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        discountType: e.target.value as PromoCodeFormData["discountType"],
                      })
                    }
                    className={adminInputCls}
                  >
                    <option value="percent">Процент (%)</option>
                    <option value="fixed">Фиксированная (₽)</option>
                  </select>
                </Field>
                <Field label={valueLabel} required>
                  <input
                    type="number"
                    min="0"
                    step={form.discountType === "percent" ? "1" : "0.01"}
                    value={form.discountValue}
                    onChange={(e) =>
                      setForm({ ...form, discountValue: Number(e.target.value) || 0 })
                    }
                    className={adminInputCls}
                  />
                </Field>
              </div>
            </div>
          </FormSection>

          <FormSection title="Условия" description="Минимальная сумма заказа для применения кода">
            <Field label="Мин. сумма заказа (₽)" hint="0 — без ограничения">
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.minOrderAmount}
                onChange={(e) =>
                  setForm({ ...form, minOrderAmount: Number(e.target.value) || 0 })
                }
                className={adminInputCls}
              />
            </Field>
          </FormSection>

          <FormSection title="Лимиты" description="Ограничение количества активаций">
            <Field label="Макс. использований" hint="Пусто — без лимита">
              <input
                type="number"
                min="1"
                value={form.maxUses ?? ""}
                placeholder="Без ограничений"
                onChange={(e) =>
                  setForm({
                    ...form,
                    maxUses: e.target.value ? Number(e.target.value) : null,
                  })
                }
                className={adminInputCls}
              />
            </Field>
          </FormSection>

          <FormSection title="Срок действия">
            <Field label="Действует до" hint="Пусто — бессрочно">
              <input
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                className={adminInputCls}
              />
            </Field>
          </FormSection>

          <FormSection title="Дополнительно">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Активен</p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Неактивные коды нельзя применить при оплате
                </p>
              </div>
              <ToggleSwitch
                value={form.isActive}
                onChange={(value) => setForm({ ...form, isActive: value })}
                label="Активен"
              />
            </div>
          </FormSection>
        </div>

        <ActionsSidebar
          onSave={handleSave}
          onDelete={isEdit ? handleDelete : undefined}
          saving={saving}
          error={error}
          isEdit={isEdit}
        />
      </div>
    </div>
  );
}
