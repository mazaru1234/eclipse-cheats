import { Suspense } from "react";
import { getAdminCategories, listAdminProductLines } from "@/lib/services/admin-catalog";
import { ProductLinesAdminClient } from "@/components/admin/ProductLinesAdminClient";

export default async function AdminProductsPage() {
  const [{ rows, total }, categories] = await Promise.all([
    listAdminProductLines({ includeInactive: true, limit: 100 }),
    getAdminCategories(true),
  ]);

  return (
    <Suspense fallback={<p className="text-sm text-[var(--color-text-secondary)]">Загрузка…</p>}>
      <ProductLinesAdminClient
        initialRows={rows}
        initialTotal={total}
        categories={categories.map((category) => ({ id: category.id, name: category.name }))}
      />
    </Suspense>
  );
}
