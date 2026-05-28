import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { listReviewsAdmin, reviewStats } from "@/lib/services/reviews";
import type { ReviewStatus } from "@/lib/services/reviews";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const status = (searchParams.get("status") || "pending") as ReviewStatus | "all";
    const search = searchParams.get("search") || undefined;

    const [rows, stats] = await Promise.all([
      listReviewsAdmin({ status, search, limit: 100 }),
      reviewStats(),
    ]);

    return NextResponse.json({ rows, stats });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
