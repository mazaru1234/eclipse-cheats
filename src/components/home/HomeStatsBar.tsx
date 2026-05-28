interface HomeStatsBarProps {
  games: number;
  products: number;
  reviews: number;
  avgRating: number;
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center sm:text-left">
      <p className="text-lg font-semibold tabular-nums text-gold sm:text-xl">{value}</p>
      <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{label}</p>
    </div>
  );
}

export function HomeStatsBar({ games, products, reviews, avgRating }: HomeStatsBarProps) {
  if (games === 0 && products === 0) return null;

  return (
    <section className="border-y border-[var(--color-border)] bg-[var(--color-bg-elevated)]/30">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 sm:grid-cols-4 sm:px-6 sm:py-10">
        <Stat value={String(games)} label={games === 1 ? "игра" : games < 5 ? "игры" : "игр"} />
        <Stat value={String(products)} label={products === 1 ? "товар" : products < 5 ? "товара" : "товаров"} />
        <Stat
          value={reviews > 0 ? String(reviews) : "—"}
          label={reviews === 1 ? "отзыв" : reviews < 5 ? "отзыва" : "отзывов"}
        />
        <Stat value={avgRating > 0 ? avgRating.toFixed(1) : "—"} label="средняя оценка" />
      </div>
    </section>
  );
}
