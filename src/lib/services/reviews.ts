import { nanoid } from "nanoid";
import { eq, and, desc, avg, count, or, like } from "drizzle-orm";
import { db } from "../db";
import { reviews, users, productLines, categories, orders, products } from "../db/schema";

export type ReviewStatus = "pending" | "approved" | "rejected";

export async function userHasCompletedOrderForLine(userId: string, productLineId: string) {
  const [row] = await db
    .select({ id: orders.id })
    .from(orders)
    .innerJoin(products, eq(orders.productId, products.id))
    .where(
      and(
        eq(orders.userId, userId),
        eq(products.lineId, productLineId),
        eq(orders.status, "completed")
      )
    )
    .limit(1);
  return !!row;
}

export async function getUserReviewForLine(userId: string, productLineId: string) {
  const [row] = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.userId, userId), eq(reviews.productLineId, productLineId)))
    .limit(1);
  return row ?? null;
}

export async function canUserReviewLine(userId: string, productLineId: string) {
  const existing = await getUserReviewForLine(userId, productLineId);
  if (existing) {
    return { canReview: false as const, reason: "already_reviewed" as const, review: existing };
  }
  const hasOrder = await userHasCompletedOrderForLine(userId, productLineId);
  if (!hasOrder) {
    return { canReview: false as const, reason: "no_purchase" as const };
  }
  return { canReview: true as const };
}

export async function createReview(params: {
  userId: string;
  productLineId: string;
  rating: number;
  body: string;
}) {
  const check = await canUserReviewLine(params.userId, params.productLineId);
  if (!check.canReview) {
    if (check.reason === "already_reviewed") throw new Error("Вы уже оставили отзыв на этот товар");
    if (check.reason === "no_purchase") throw new Error("Отзыв доступен только после покупки");
    throw new Error("Не удалось создать отзыв");
  }

  const [orderRow] = await db
    .select({ id: orders.id })
    .from(orders)
    .innerJoin(products, eq(orders.productId, products.id))
    .where(
      and(
        eq(orders.userId, params.userId),
        eq(products.lineId, params.productLineId),
        eq(orders.status, "completed")
      )
    )
    .orderBy(desc(orders.completedAt))
    .limit(1);

  const id = nanoid();
  await db.insert(reviews).values({
    id,
    userId: params.userId,
    productLineId: params.productLineId,
    orderId: orderRow?.id,
    rating: params.rating,
    body: params.body.trim(),
    status: "pending",
  });

  const [review] = await db.select().from(reviews).where(eq(reviews.id, id)).limit(1);
  return review!;
}

export async function getApprovedReviewsForLine(productLineId: string, limit = 20) {
  return db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      body: reviews.body,
      createdAt: reviews.createdAt,
      username: users.username,
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .where(and(eq(reviews.productLineId, productLineId), eq(reviews.status, "approved")))
    .orderBy(desc(reviews.createdAt))
    .limit(limit);
}

export async function getReviewSummary(productLineId: string) {
  const [row] = await db
    .select({
      avgRating: avg(reviews.rating),
      total: count(reviews.id),
    })
    .from(reviews)
    .where(and(eq(reviews.productLineId, productLineId), eq(reviews.status, "approved")));

  return {
    avgRating: row?.avgRating ? Math.round(Number(row.avgRating) * 10) / 10 : 0,
    total: row?.total ?? 0,
  };
}

export async function listRecentApprovedReviews(limit = 40) {
  return db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      body: reviews.body,
      createdAt: reviews.createdAt,
      username: users.username,
      lineName: productLines.name,
      lineSlug: productLines.slug,
      gameName: categories.name,
      gameSlug: categories.slug,
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .innerJoin(productLines, eq(reviews.productLineId, productLines.id))
    .innerJoin(categories, eq(productLines.categoryId, categories.id))
    .where(eq(reviews.status, "approved"))
    .orderBy(desc(reviews.createdAt))
    .limit(limit);
}

export async function listReviewsAdmin(params: {
  status?: ReviewStatus | "all";
  search?: string;
  limit?: number;
}) {
  const conditions = [];

  if (params.status && params.status !== "all") {
    conditions.push(eq(reviews.status, params.status));
  }

  if (params.search) {
    const q = `%${params.search.trim()}%`;
    conditions.push(
      or(
        like(users.username, q),
        like(productLines.name, q),
        like(categories.name, q),
        like(reviews.body, q)
      )
    );
  }

  const rows = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      body: reviews.body,
      status: reviews.status,
      createdAt: reviews.createdAt,
      username: users.username,
      lineName: productLines.name,
      lineSlug: productLines.slug,
      gameName: categories.name,
      gameSlug: categories.slug,
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .innerJoin(productLines, eq(reviews.productLineId, productLines.id))
    .innerJoin(categories, eq(productLines.categoryId, categories.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(reviews.createdAt))
    .limit(params.limit ?? 100);

  return rows;
}

export async function reviewStats() {
  const rows = await db.select({ status: reviews.status }).from(reviews);
  return {
    pending: rows.filter((r) => r.status === "pending").length,
    approved: rows.filter((r) => r.status === "approved").length,
    rejected: rows.filter((r) => r.status === "rejected").length,
    total: rows.length,
  };
}

export async function getGlobalReviewSummary() {
  const [row] = await db
    .select({
      avgRating: avg(reviews.rating),
      total: count(reviews.id),
    })
    .from(reviews)
    .where(eq(reviews.status, "approved"));

  return {
    avgRating: row?.avgRating ? Math.round(Number(row.avgRating) * 10) / 10 : 0,
    total: row?.total ?? 0,
  };
}

export async function moderateReview(id: string, status: "approved" | "rejected") {
  await db
    .update(reviews)
    .set({ status, updatedAt: new Date() })
    .where(eq(reviews.id, id));
}
