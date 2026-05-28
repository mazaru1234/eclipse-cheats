import { Suspense } from "react";
import { getAdminCategories } from "@/lib/services/admin-catalog";
import { ProductLineForm } from "@/components/admin/ProductLineForm";

export default async function NewProductPage() {
  const categories = await getAdminCategories(true);

  return (
    <Suspense fallback={<p className="text-sm text-[var(--color-text-secondary)]">Загрузка…</p>}>
      <ProductLineForm categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
    </Suspense>
  );
}
