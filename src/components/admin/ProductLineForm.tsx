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
import { TiersEditor } from "./TiersEditor";
import { FeatureGroupsEditor } from "./FeatureGroupsEditor";
import { ImageUploadField } from "./ImageUploadField";
import { GalleryUploadField } from "./GalleryUploadField";
import { slugify } from "@/lib/utils";
import {
  createEmptyFeatureGroup,
  featureGroupsToJson,
  type ProductLineFormData,
} from "@/lib/admin-product-form";
import { galleryToJsonArray, linesToJsonArray } from "@/lib/product-utils";
import { PRODUCT_STATUS_OPTIONS } from "@/lib/product-status";

interface CategoryOption {
  id: string;
  name: string;
}

function safeBackHref(raw: string | null) {
  if (!raw) return "/admin/products";
  return raw.startsWith("/admin/") ? raw : "/admin/products";
}

export function ProductLineForm({
  initial,
  categories,
}: {
  initial?: ProductLineFormData;
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const backHref = safeBackHref(searchParams.get("from"));
  const isEdit = !!initial?.id;

  const [form, setForm] = useState<ProductLineFormData>(
    initial ?? {
      categoryId: categories[0]?.id ?? "",
      name: "",
      slug: "",
      description: "",
      longDescription: "",
      imageUrl: "",
      galleryText: "",
      featureGroups: [createEmptyFeatureGroup("AIM")],
      systemRequirementsText: "",
      safetyRating: 5,
      functionalityRating: 5,
      status: "on_update",
      needsUsb: false,
      hasSpoofer: false,
      isActive: true,
      sortOrder: 0,
    }
  );
  const [slugTouched, setSlugTouched] = useState(!!initial?.slug);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function update<K extends keyof ProductLineFormData>(key: K, value: ProductLineFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setError("");
    if (!form.name.trim()) {
      setError("Укажите название товара");
      return;
    }
    if (!form.categoryId) {
      setError("Выберите категорию");
      return;
    }

    setSaving(true);
    const payload = {
      categoryId: form.categoryId,
      name: form.name.trim(),
      slug: (form.slug || slugify(form.name)).trim(),
      description: form.description || null,
      longDescription: form.longDescription || null,
      imageUrl: form.imageUrl || null,
      galleryUrls: galleryToJsonArray(form.galleryText),
      features: featureGroupsToJson(form.featureGroups),
      systemRequirements: linesToJsonArray(form.systemRequirementsText),
      safetyRating: form.safetyRating,
      functionalityRating: form.functionalityRating,
      status: form.status,
      needsUsb: form.needsUsb,
      hasSpoofer: form.hasSpoofer,
      isActive: form.isActive,
      sortOrder: form.sortOrder,
    };

    try {
      const res = isEdit
        ? await fetch(`/api/admin/product-lines/${initial!.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/admin/product-lines", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ошибка сохранения");
        return;
      }

      if (!isEdit && data.id) {
        router.push(`/admin/products/${data.id}?from=${encodeURIComponent(backHref)}`);
      } else {
        router.push(backHref);
      }
      router.refresh();
    } catch {
      setError("Ошибка сети");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!isEdit || !confirm("Удалить товар и все тарифы?")) return;
    const res = await fetch(`/api/admin/product-lines/${initial!.id}`, { method: "DELETE" });
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
        title={isEdit ? "Редактировать товар" : "Создание товара"}
        subtitle={isEdit ? `ID: ${initial!.id}` : "После создания добавьте тарифы"}
        backHref={backHref}
        backLabel="Назад к списку товаров"
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-5">
          <FormSection title="Основные данные">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Название" required>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => {
                    const value = e.target.value;
                    update("name", value);
                    if (!slugTouched) update("slug", slugify(value));
                  }}
                  className={adminInputCls}
                  placeholder="Eclipse Lite"
                />
              </Field>
              <Field label="Категория" required>
                <select
                  value={form.categoryId}
                  onChange={(e) => update("categoryId", e.target.value)}
                  className={adminInputCls}
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="mt-4 space-y-4">
              <Field label="Slug" hint="URL: /catalog/[категория]/[slug]">
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    update("slug", e.target.value);
                  }}
                  className={`${adminInputCls} font-mono`}
                />
              </Field>
              <Field label="Краткое описание">
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  className={adminInputCls}
                />
              </Field>
              <Field label="Полное описание">
                <textarea
                  rows={4}
                  value={form.longDescription}
                  onChange={(e) => update("longDescription", e.target.value)}
                  className={adminInputCls}
                />
              </Field>
            </div>
          </FormSection>

          <FormSection title="Медиа">
            <div className="space-y-4">
              <Field label="Обложка" hint="Загрузите файл или вставьте ссылку">
                <ImageUploadField
                  value={form.imageUrl}
                  onChange={(imageUrl) => update("imageUrl", imageUrl)}
                  folder="product-lines"
                />
              </Field>
              <Field label="Галерея" hint="Загрузите файлы или добавьте ссылки построчно">
                <GalleryUploadField
                  value={form.galleryText}
                  onChange={(galleryText) => update("galleryText", galleryText)}
                  folder="product-lines"
                />
              </Field>
            </div>
          </FormSection>

          <FormSection title="Характеристики">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Безопасность (1-5)">
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={form.safetyRating}
                  onChange={(e) => update("safetyRating", Number(e.target.value))}
                  className={adminInputCls}
                />
              </Field>
              <Field label="Функционал (1-5)">
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={form.functionalityRating}
                  onChange={(e) => update("functionalityRating", Number(e.target.value))}
                  className={adminInputCls}
                />
              </Field>
            </div>
            <Field label="Статус товара" hint="Отображается на карточке и странице товара">
              <select
                value={form.status}
                onChange={(e) => update("status", e.target.value as ProductLineFormData["status"])}
                className={adminInputCls}
              >
                {PRODUCT_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <div className="mt-4 space-y-3">
              {[
                { key: "needsUsb" as const, label: "Нужна USB флешка" },
                { key: "hasSpoofer" as const, label: "Есть HWID спуфер" },
                { key: "isActive" as const, label: "Активен в каталоге" },
              ].map(({ key, label }) => (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-xl border border-[var(--color-border)] px-4 py-3"
                >
                  <span className="text-sm">{label}</span>
                  <ToggleSwitch value={form[key]} onChange={(value) => update(key, value)} />
                </div>
              ))}
            </div>
          </FormSection>

          <FormSection
            title="Функционал"
            description="Создай группу (AIM, ESP, MISC…) и пиши функции построчно — Enter = новая строка"
          >
            <FeatureGroupsEditor
              groups={form.featureGroups}
              onChange={(groups) => update("featureGroups", groups)}
            />
          </FormSection>

          <FormSection title="Системные требования и сортировка">
            <div className="space-y-4">
              <Field label="Системные требования" hint="По одному пункту на строку">
                <textarea
                  rows={4}
                  value={form.systemRequirementsText}
                  onChange={(e) => update("systemRequirementsText", e.target.value)}
                  className={adminInputCls}
                />
              </Field>
              <Field label="Порядок сортировки">
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => update("sortOrder", Number(e.target.value))}
                  className={adminInputCls}
                />
              </Field>
            </div>
          </FormSection>

          {isEdit && initial?.id && (
            <FormSection title="Тарифы" description="Без тарифов пользователи не смогут купить товар">
              <TiersEditor lineId={initial.id} />
            </FormSection>
          )}
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
