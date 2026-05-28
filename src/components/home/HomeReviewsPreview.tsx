import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ReviewStars } from "@/components/reviews/ReviewStars";

interface ReviewPreview {
  id: string;
  rating: number;
  body: string;
  username: string;
  lineName: string;
  gameName: string;
}

interface HomeReviewsPreviewProps {
  reviews: ReviewPreview[];
  avgRating: number;
  total: number;
}

export function HomeReviewsPreview({ reviews, avgRating, total }: HomeReviewsPreviewProps) {
  if (reviews.length === 0) return null;

  return (
    <section className="border-t border-[var(--color-border)] bg-[var(--color-bg-elevated)]/20">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-label">Отзывы</p>
            <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">Что говорят покупатели</h2>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              {avgRating > 0 && (
                <>
                  <span className="text-gold">{avgRating}</span> из 5 ·{" "}
                </>
              )}
              {total}{" "}
              {total === 1 ? "отзыв" : total < 5 ? "отзыва" : "отзывов"}
            </p>
          </div>
          <Link href="/reviews" className="btn btn-ghost shrink-0 py-2 text-sm">
            Все отзывы
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <ul className="grid gap-4 md:grid-cols-3">
          {reviews.slice(0, 3).map((review) => (
            <li
              key={review.id}
              className="flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)]/60 p-5"
            >
              <ReviewStars value={review.rating} readonly size="sm" />
              <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--color-text-secondary)] line-clamp-4">
                {review.body}
              </p>
              <div className="mt-4 border-t border-[var(--color-border)] pt-4">
                <p className="text-sm font-medium">{review.username}</p>
                <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                  {review.gameName} · {review.lineName}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
