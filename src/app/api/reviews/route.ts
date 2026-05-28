import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession, requireAuth } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/security";
import {
  createReview,
  getApprovedReviewsForLine,
  getReviewSummary,
  canUserReviewLine,
} from "@/lib/services/reviews";

const createSchema = z.object({
  productLineId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  body: z.string().min(10).max(2000),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productLineId = searchParams.get("productLineId");

  if (!productLineId) {
    return NextResponse.json({ error: "productLineId required" }, { status: 400 });
  }

  const [items, summary, session] = await Promise.all([
    getApprovedReviewsForLine(productLineId),
    getReviewSummary(productLineId),
    getSession(),
  ]);

  let canReview = false;
  let reviewReason: string | null = null;
  if (session) {
    const check = await canUserReviewLine(session.id, productLineId);
    canReview = check.canReview;
    if (!check.canReview) reviewReason = check.reason;
  } else {
    reviewReason = "login";
  }

  return NextResponse.json({ items, summary, canReview, reviewReason });
}

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "reviews", 5, 60_000);
  if (limited) return limited;

  try {
    const session = await requireAuth();
    const body = createSchema.parse(await request.json());
    const review = await createReview({
      userId: session.id,
      productLineId: body.productLineId,
      rating: body.rating,
      body: body.body,
    });

    return NextResponse.json({
      id: review.id,
      status: review.status,
      message: "Отзыв отправлен на модерацию",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось создать отзыв";
    const status = message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
