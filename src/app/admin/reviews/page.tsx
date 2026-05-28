import { listReviewsAdmin, reviewStats } from "@/lib/services/reviews";
import { ReviewsAdminClient } from "@/components/admin/ReviewsAdminClient";

export default async function AdminReviewsPage() {
  const [rows, stats] = await Promise.all([
    listReviewsAdmin({ status: "pending", limit: 100 }),
    reviewStats(),
  ]);

  return <ReviewsAdminClient initialRows={rows} initialStats={stats} />;
}
