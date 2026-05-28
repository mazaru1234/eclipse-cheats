import { getAdminPromoCodes } from "@/lib/services/admin-promo";
import { PromoCodesAdminClient } from "@/components/admin/PromoCodesAdminClient";

export default async function AdminPromoCodesPage() {
  const promoCodes = await getAdminPromoCodes();
  return <PromoCodesAdminClient initial={promoCodes} />;
}
