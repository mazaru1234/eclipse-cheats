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
import { ImageUploadField } from "./ImageUploadField";
import { slugify } from "@/lib/utils";

export interface CategoryFormData {
  id?: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  sortOrder: number;
  isActive: boolean;
}

function safeBackHref(raw: string | null) {
  if (!raw) return "/admin/categories";
  return raw.startsWith("/admin/") ? raw : "/admin/categories";
}

export function CategoryForm({ initial }: { initial?: CategoryFormData }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const backHref = safeBackHref(searchParams.get("from"));
  const isEdit = !!initial?.id;

  const [form, setForm] = useState<CategoryFormData>(
    initial ?? {
      name: "",
      slug: "",
      description: "",
      imageUrl: "",
      sortOrder: 0,
      isActive: true,
    }
  );
  const [slugTouched, setSlugTouched] = useState(!!initial?.slug);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setError("");
    if (!form.name.trim()) {
      setError("Укажите название категории");
      return;
    }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      slug: (form.slug || slugify(form.name)).trim(),
      description: form.description || null,
      imageUrl: form.imageUrl || null,
      sortOrder: form.sortOrder,
      isActive: form.isActive,
    };

    try {
      const res = isEdit
        ? await fetch(`/api/admin/categories/${initial!.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/admin/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      const data = await res.json();
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
    if (!isEdit || !confirm("Удалить категорию?")) return;
    const res = await fetch(`/api/admin/categories/${initial!.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Не удалось удалить");
      return;
    }
    router.push(backHref);
    router.refresh();
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? "Редактировать категорию" : "Создание категории"}
        backHref={backHref}
        backLabel="Назад к списку категорий"
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-5">
          <FormSection title="Основные данные">
            <div className="space-y-4">
              <Field label="Название" required>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => {
                    const value = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      name: value,
                      slug: slugTouched ? prev.slug : slugify(value),
                    }));
                  }}
                  className={adminInputCls}
                  placeholder="Rust"
                />
              </Field>
              <Field label="Slug (URL)" hint="Используется в /catalog/rust">
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setForm((prev) => ({ ...prev, slug: e.target.value }));
                  }}
                  className={`${adminInputCls} font-mono`}
                  placeholder="rust"
                />
              </Field>
              <Field label="Описание">
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  className={adminInputCls}
                />
              </Field>
            </div>
          </FormSection>

          <FormSection title="Медиа">
            <Field label="Изображение" hint="Загрузите файл или вставьте ссылку">
              <ImageUploadField
                value={form.imageUrl}
                onChange={(imageUrl) => setForm((prev) => ({ ...prev, imageUrl }))}
                folder="categories"
              />
            </Field>
          </FormSection>

          <FormSection title="Настройки отображения">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Порядок сортировки">
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: Number(e.target.value) }))}
                  className={adminInputCls}
                />
              </Field>
              <div className="flex items-center justify-between rounded-xl border border-[var(--color-border)] px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Активна</p>
                  <p className="text-xs text-[var(--color-text-muted)]">Показывать в каталоге</p>
                </div>
                <ToggleSwitch
                  value={form.isActive}
                  onChange={(value) => setForm((prev) => ({ ...prev, isActive: value }))}
                />
              </div>
            </div>
          </FormSection>
        </div>

        <ActionsSidebar
          onSave={handleSave}
          onDelete={handleDelete}
          saving={saving}
          error={error}
          isEdit={isEdit}
        />
      </div>
    </div>
  );
}
