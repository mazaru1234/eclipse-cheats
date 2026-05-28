import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getAdminCategories, getAdminProductLine } from "@/lib/services/admin-catalog";
import { productLineToFormData } from "@/lib/admin-product-form";
import { ProductLineForm } from "@/components/admin/ProductLineForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;
  const [line, categories] = await Promise.all([getAdminProductLine(id), getAdminCategories(true)]);
  if (!line) notFound();

  return (
    <Suspense fallback={<p className="text-sm text-[var(--color-text-secondary)]">Загрузка…</p>}>
      <ProductLineForm
        initial={productLineToFormData(line)}
        categories={categories.map((category) => ({ id: category.id, name: category.name }))}
      />
    </Suspense>
  );
}
