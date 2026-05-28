"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { PageHeader, PrimaryButton, StatCard, adminInputCls } from "./AdminPrimitives";
import { formatCurrency } from "@/lib/utils";
import { ProductStatusBadge } from "@/components/shop/ProductStatusBadge";
import type { ProductStatus } from "@/lib/product-status";

interface CategoryOption {
  id: string;
  name: string;
}

interface ProductLineRow {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  description: string | null;
  imageUrl: string | null;
  status: ProductStatus;
  isActive: boolean;
  tierCount: number;
  minPrice: number;
  availableKeys: number;
}

export function ProductLinesAdminClient({
  initialRows,
  initialTotal,
  categories,
}: {
  initialRows: ProductLineRow[];
  initialTotal: number;
  categories: CategoryOption[];
}) {
  const searchParams = useSearchParams();
  const [rows, setRows] = useState(initialRows);
  const [total, setTotal] = useState(initialTotal);
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("cat") ?? "");
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [sort, setSort] = useState(searchParams.get("sort") ?? "newest");
  const [loading, setLoading] = useState(false);

  const fromHref = useMemo(() => {
    const qs = new URLSearchParams();
    if (categoryFilter) qs.set("cat", categoryFilter);
    if (search) qs.set("q", search);
    if (sort !== "newest") qs.set("sort", sort);
    const query = qs.toString();
    return query ? `/admin/products?${query}` : "/admin/products";
  }, [categoryFilter, search, sort]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (categoryFilter) qs.set("categoryId", categoryFilter);
      if (search) qs.set("search", search);
      qs.set("sort", sort);
      qs.set("all", "1");
      const res = await fetch(`/api/admin/product-lines?${qs}`, { cache: "no-store" });
      const data = await res.json();
      if (res.ok) {
        setRows(data.rows ?? []);
        setTotal(data.total ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, search, sort]);

  useEffect(() => {
    const timer = setTimeout(refresh, 300);
    return () => clearTimeout(timer);
  }, [refresh]);

  return (
    <div>
      <PageHeader
        hideTitle
        title="Товары"
        subtitle={`${total} товаров в каталоге`}
        actions={
          <Link href={`/admin/products/new?from=${encodeURIComponent(fromHref)}`}>
            <PrimaryButton>
              <span className="inline-flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Создать товар
              </span>
            </PrimaryButton>
          </Link>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Товаров" value={total} color="#e8b923" />
        <StatCard label="С тарифами" value={rows.filter((r) => r.tierCount > 0).length} color="#22c55e" />
        <StatCard label="В наличии" value={rows.filter((r) => r.availableKeys > 0).length} color="#ffffff" />
        <StatCard label="Скрытых" value={rows.filter((r) => !r.isActive).length} color="#71717a" />
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className={`${adminInputCls} max-w-[220px]`}
        >
          <option value="">Все категории</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className={`${adminInputCls} max-w-[180px]`}
        >
          <option value="newest">Сначала новые</option>
          <option value="oldest">Сначала старые</option>
          <option value="name">По названию</option>
          <option value="price_asc">Цена ↑</option>
          <option value="price_desc">Цена ↓</option>
        </select>
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск товаров"
            className={`${adminInputCls} pl-10`}
          />
        </div>
      </div>

      {loading && <p className="mb-3 text-xs text-[var(--color-text-muted)]">Обновление…</p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => (
          <Link
            key={row.id}
            href={`/admin/products/${row.id}?from=${encodeURIComponent(fromHref)}`}
            className="card card-hover block overflow-hidden"
          >
            <div className="relative h-36 bg-[var(--color-bg-elevated)]">
              {row.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={row.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center px-4 text-center font-display text-xl font-bold uppercase text-white/20">
                  {row.name}
                </div>
              )}
              <span className={`absolute left-3 top-3 badge ${row.isActive ? "badge-success" : ""}`}>
                {row.isActive ? "Активен" : "Скрыт"}
              </span>
              <ProductStatusBadge
                status={row.status}
                className="absolute right-3 top-3 text-[10px]"
              />
            </div>
            <div className="space-y-2 p-4">
              <p className="text-xs text-[var(--color-text-muted)]">{row.categoryName}</p>
              <h3 className="font-display text-lg font-bold">{row.name}</h3>
              <p className="text-xs text-[var(--color-text-muted)]">/{row.categorySlug}/{row.slug}</p>
              {row.description && (
                <p className="line-clamp-2 text-sm text-[var(--color-text-secondary)]">{row.description}</p>
              )}
              <div className="flex flex-wrap gap-3 text-xs text-[var(--color-text-muted)]">
                <span>{row.tierCount} тарифов</span>
                <span>от {formatCurrency(row.minPrice)}</span>
                <span>{row.availableKeys > 0 ? "В наличии" : "Нет ключей"}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {rows.length === 0 && (
        <div className="card py-16 text-center text-sm text-[var(--color-text-secondary)]">
          Товары не найдены
        </div>
      )}
    </div>
  );
}
