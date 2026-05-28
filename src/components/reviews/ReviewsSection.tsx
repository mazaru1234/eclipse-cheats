"use client";

import Link from "next/link";
import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { ReviewStars } from "./ReviewStars";

interface ReviewItem {
  id: string;
  rating: number;
  body: string;
  createdAt: string | Date;
  username: string;
}

interface ReviewsSectionProps {
  productLineId: string;
  lineName: string;
  initialReviews: ReviewItem[];
  initialSummary: { avgRating: number; total: number };
  canReview: boolean;
  reviewReason: string | null;
  isLoggedIn: boolean;
}

function fmtDate(value: string | Date) {
  const d = value instanceof Date ? value : new Date(value);
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

export function ReviewsSection({
  productLineId,
  lineName,
  initialReviews,
  initialSummary,
  canReview,
  reviewReason,
  isLoggedIn,
}: ReviewsSectionProps) {
  const [reviews] = useState(initialReviews);
  const [summary] = useState(initialSummary);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productLineId, rating, body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка отправки");

      setSubmitted(true);
      setShowForm(false);
      setMessage(data.message || "Отзыв отправлен на модерацию");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка отправки");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">Отзывы покупателей</h2>
          {summary.total > 0 && (
            <div className="mt-1 flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
              <ReviewStars value={Math.round(summary.avgRating)} readonly size="sm" />
              <span>
                {summary.avgRating} · {summary.total}{" "}
                {summary.total === 1 ? "отзыв" : summary.total < 5 ? "отзыва" : "отзывов"}
              </span>
            </div>
          )}
        </div>

        {canReview && !submitted && (
          <button
            type="button"
            className="btn btn-ghost py-2 text-xs"
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? "Отмена" : "Оставить отзыв"}
          </button>
        )}
      </div>

      {message && (
        <p className="mt-4 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          {message}
        </p>
      )}

      {showForm && canReview && (
        <form onSubmit={handleSubmit} className="mt-5 space-y-4 rounded-xl border border-[var(--color-border)] p-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Поделитесь впечатлением о {lineName}
          </p>
          <ReviewStars value={rating} onChange={setRating} />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Расскажите о качестве, стабильности, поддержке…"
            rows={4}
            minLength={10}
            maxLength={2000}
            required
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-4 py-3 text-sm outline-none focus:border-gold/50"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" disabled={loading} className="btn btn-primary py-2 text-xs">
            {loading ? "Отправка…" : "Отправить на модерацию"}
          </button>
        </form>
      )}

      {!canReview && !submitted && reviewReason === "login" && (
        <p className="mt-4 text-sm text-[var(--color-text-secondary)]">
          <Link href="/login" className="text-gold hover:underline">
            Войдите
          </Link>
          , чтобы оставить отзыв после покупки.
        </p>
      )}

      {!canReview && reviewReason === "no_purchase" && isLoggedIn && (
        <p className="mt-4 text-sm text-[var(--color-text-secondary)]">
          Отзыв доступен только после покупки этого товара.
        </p>
      )}

      {!canReview && reviewReason === "already_reviewed" && !submitted && (
        <p className="mt-4 text-sm text-[var(--color-text-secondary)]">
          Вы уже оставили отзыв на этот товар.
        </p>
      )}

      {reviews.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-[var(--color-border)] py-10 text-center">
          <MessageCircle className="mx-auto h-8 w-8 text-[var(--color-text-muted)]" aria-hidden />
          <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
            Пока нет отзывов. Станьте первым!
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {reviews.map((review) => (
            <li
              key={review.id}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/50 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/15 text-sm font-bold text-gold">
                    {review.username.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{review.username}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{fmtDate(review.createdAt)}</p>
                  </div>
                </div>
                <ReviewStars value={review.rating} readonly size="sm" />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                {review.body}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
