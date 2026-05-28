import { notFound } from "next/navigation";
import { PromoCodeForm } from "@/components/admin/PromoCodeForm";
import { getAdminPromoCodeById } from "@/lib/services/admin-promo";

export default async function AdminPromoCodeEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const promo = await getAdminPromoCodeById(id);
  if (!promo) notFound();
  return <PromoCodeForm initial={promo} />;
}
