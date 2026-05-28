import { Suspense } from "react";
import { CategoryForm } from "@/components/admin/CategoryForm";

export default function NewCategoryPage() {
  return (
    <Suspense fallback={<p className="text-sm text-[var(--color-text-secondary)]">Загрузка…</p>}>
      <CategoryForm />
    </Suspense>
  );
}
