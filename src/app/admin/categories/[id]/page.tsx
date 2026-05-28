import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getAdminCategory } from "@/lib/services/admin-catalog";
import { CategoryForm } from "@/components/admin/CategoryForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCategoryPage({ params }: PageProps) {
  const { id } = await params;
  const category = await getAdminCategory(id);
  if (!category) notFound();

  const initial = {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description ?? "",
    imageUrl: category.imageUrl ?? "",
    sortOrder: category.sortOrder,
    isActive: category.isActive,
  };

  return (
    <Suspense fallback={<p className="text-sm text-[var(--color-text-secondary)]">Загрузка…</p>}>
      <CategoryForm initial={initial} />
    </Suspense>
  );
}
