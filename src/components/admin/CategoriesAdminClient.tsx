"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Trash2 } from "lucide-react";
import { PageHeader, PrimaryButton, StatCard, adminInputCls } from "./AdminPrimitives";

export interface AdminCategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
}

export function CategoriesAdminClient({ initial }: { initial: AdminCategoryRow[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(true);

  const visible = useMemo(() => {
    let rows = [...items];
    if (!showInactive) rows = rows.filter((item) => item.isActive);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.slug.toLowerCase().includes(q) ||
          (item.description ?? "").toLowerCase().includes(q)
      );
    }
    return rows.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "ru"));
  }, [items, search, showInactive]);

  const totalProducts = items.reduce((sum, item) => sum + item.productCount, 0);

  async function handleDelete(id: string) {
    if (!confirm("Удалить категорию?")) return;
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Не удалось удалить");
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
    router.refresh();
  }

  return (
    <div>
      <PageHeader
        hideTitle
        title="Категории"
        subtitle={`${items.length} категорий · ${totalProducts} товаров`}
        actions={
          <Link href="/admin/categories/new">
            <PrimaryButton>
              <span className="inline-flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Создать категорию
              </span>
            </PrimaryButton>
          </Link>
        }
      />

      <div className="admin-stat-grid mb-6">
        <StatCard label="Категорий" value={items.length} color="#e8b923" />
        <StatCard label="Товаров" value={totalProducts} color="#22c55e" />
        <StatCard label="Активных" value={items.filter((i) => i.isActive).length} color="#ffffff" />
        <StatCard label="Скрытых" value={items.filter((i) => !i.isActive).length} color="#71717a" />
      </div>

      <div className="admin-panel mb-5 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск категорий"
              className={`${adminInputCls} pl-10`}
            />
          </div>
          <label className="flex min-h-[44px] shrink-0 items-center gap-2 text-sm text-[var(--color-text-secondary)]">
            <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
            Показывать скрытые
          </label>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((item) => (
          <Link
            key={item.id}
            href={`/admin/categories/${item.id}?from=${encodeURIComponent("/admin/categories")}`}
            className="admin-panel block overflow-hidden transition-colors hover:border-[rgba(232,185,35,0.25)]"
          >
            <div className="relative h-28 bg-[var(--color-bg-elevated)]">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center font-display text-3xl font-bold uppercase text-white/20">
                  {item.name.slice(0, 2)}
                </div>
              )}
              <span className={`absolute left-3 top-3 badge ${item.isActive ? "badge-success" : ""}`}>
                {item.isActive ? "Активна" : "Скрыта"}
              </span>
            </div>
            <div className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg font-bold">{item.name}</h3>
                  <p className="text-xs text-[var(--color-text-muted)]">/{item.slug}</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete(item.id);
                  }}
                  className="text-[var(--color-danger)] hover:opacity-80"
                  aria-label="Удалить"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {item.description && (
                <p className="line-clamp-2 text-sm text-[var(--color-text-secondary)]">{item.description}</p>
              )}
              <p className="text-xs text-[var(--color-text-muted)]">
                {item.productCount} товаров · порядок {item.sortOrder}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {visible.length === 0 && (
        <div className="admin-panel py-16 text-center text-sm text-[var(--color-text-secondary)]">
          Категории не найдены
        </div>
      )}
    </div>
  );
}
