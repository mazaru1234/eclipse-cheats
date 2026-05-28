import { getAdminCategories } from "@/lib/services/admin-catalog";
import { CategoriesAdminClient } from "@/components/admin/CategoriesAdminClient";

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories(true);
  return <CategoriesAdminClient initial={categories} />;
}
