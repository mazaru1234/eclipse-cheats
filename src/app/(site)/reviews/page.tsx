import Link from "next/link";
import { Star, MessageCircle } from "lucide-react";
import { listRecentApprovedReviews, reviewStats } from "@/lib/services/reviews";
import { ReviewStars } from "@/components/reviews/ReviewStars";

export const metadata = {
  title: "Отзывы | Eclipse Cheats",
  description: "Отзывы покупателей о читах Eclipse Cheats",
};

function fmtDate(value: string | Date) {
  const d = value instanceof Date ? value : new Date(value);
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

export default async function ReviewsPage() {
  const [reviews, stats] = await Promise.all([listRecentApprovedReviews(50), reviewStats()]);

  return (
    <section className="site-container max-w-4xl py-12">
        <div className="mb-10 text-center">
          <p className="section-label">Сообщество</p>
          <h1 className="font-display text-3xl font-bold md:text-4xl">Отзывы покупателей</h1>
          <p className="mx-auto mt-3 max-w-xl text-[var(--color-text-secondary)]">
            Реальные впечатления после покупки. Отзывы проходят модерацию перед публикацией.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-[var(--color-text-muted)]">
            <span className="inline-flex items-center gap-1">
              <Star className="h-4 w-4 text-gold" />
              {stats.approved} опубликовано
            </span>
            {stats.pending > 0 && (
              <span>{stats.pending} на модерации</span>
            )}
          </div>
        </div>

        {reviews.length === 0 ? (
          <div className="card py-16 text-center">
            <MessageCircle className="mx-auto h-10 w-10 text-[var(--color-text-muted)]" />
            <p className="mt-4 text-[var(--color-text-secondary)]">
              Пока нет опубликованных отзывов. Купите товар и станьте первым!
            </p>
            <Link href="/catalog" className="btn btn-primary mt-6 inline-flex">
              Перейти в каталог
            </Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {reviews.map((review) => (
              <li key={review.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/15 font-bold text-gold">
                        {review.username.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold">{review.username}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{fmtDate(review.createdAt)}</p>
                      </div>
                    </div>
                    <Link
                      href={`/catalog/${review.gameSlug}/${review.lineSlug}`}
                      className="mt-3 inline-block text-sm text-gold hover:underline"
                    >
                      {review.lineName} · {review.gameName}
                    </Link>
                  </div>
                  <ReviewStars value={review.rating} readonly />
                </div>
                <p className="mt-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                  {review.body}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
  );
}
