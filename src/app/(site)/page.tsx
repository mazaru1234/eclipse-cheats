import Link from "next/link";
import { getGamesWithProductCounts } from "@/lib/catalog";
import { CatalogGrid } from "@/components/shop/CatalogGrid";
import { HomeStatsBar } from "@/components/home/HomeStatsBar";
import { HomeSteps } from "@/components/home/HomeSteps";
import { HomeReviewsPreview } from "@/components/home/HomeReviewsPreview";
import { HomeCta } from "@/components/home/HomeCta";
import { getGlobalReviewSummary, listRecentApprovedReviews } from "@/lib/services/reviews";
import { Reveal } from "@/components/ui/Reveal";
import { ArrowRight, ShieldCheck, Zap, Headphones } from "lucide-react";

export default async function HomePage() {
  const [items, reviewSummary, recentReviews] = await Promise.all([
    getGamesWithProductCounts(),
    getGlobalReviewSummary(),
    listRecentApprovedReviews(3),
  ]);

  const gamesCount = items.length;
  const productsCount = items.reduce((sum, item) => sum + item.productCount, 0);

  return (
    <>
      <section className="hero-section relative overflow-hidden">
        <div className="hero-bg" aria-hidden>
          <div className="hero-bg-aurora" />
          <div className="hero-bg-orbs">
            <span className="hero-orb hero-orb-1" />
            <span className="hero-orb hero-orb-2" />
            <span className="hero-orb hero-orb-3" />
            <span className="hero-orb hero-orb-4" />
            <span className="hero-orb hero-orb-5" />
          </div>
          <div className="hero-bg-glow" />
          <div className="hero-bg-grid" />
          <div className="hero-bg-arc hero-bg-arc-1" />
          <div className="hero-bg-arc hero-bg-arc-2" />
          <div className="hero-bg-shimmer" />
        </div>

        <div className="relative z-[2] mx-auto flex min-h-[calc(100dvh-4.25rem)] max-w-6xl flex-col justify-center px-4 py-16 sm:px-6 lg:min-h-[calc(100dvh-4.25rem)] lg:py-24">
          <div className="grid flex-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <div>
              <Reveal as="p" variant="fade" className="section-label">
                Магазин лицензий
              </Reveal>
              <Reveal
                as="h1"
                index={1}
                className="mt-4 font-display text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl"
              >
                Читы без
                <br />
                <span className="text-gradient-gold">лишнего шума</span>
              </Reveal>
              <Reveal
                as="p"
                index={2}
                className="mt-6 max-w-lg text-base leading-relaxed text-[var(--color-text-secondary)] sm:text-lg"
              >
                Выбирай игру в каталоге, смотри подписки внутри и получай ключ сразу после оплаты.
              </Reveal>
              <Reveal index={3} className="mt-10 flex flex-wrap gap-3">
                <a href="#catalog" className="group btn btn-primary">
                  Каталог игр
                  <ArrowRight className="arrow-nudge h-4 w-4" aria-hidden />
                </a>
                <Link href="/register" className="btn btn-ghost">
                  Создать аккаунт
                </Link>
              </Reveal>
            </div>

            <div className="relative flex min-h-[280px] items-center justify-center lg:min-h-[420px] lg:justify-end">
              <div className="hero-ring-glow" aria-hidden />
              <div className="eclipse-ring eclipse-ring-hero" aria-hidden />
            </div>
          </div>

          <div className="mt-auto grid gap-4 pt-16 sm:grid-cols-3 lg:pt-20">
            {[
              { icon: Zap, title: "Мгновенно", text: "Ключ выдаётся сразу после покупки" },
              { icon: ShieldCheck, title: "Защита заказа", text: "Каждый заказ с уникальным токеном" },
              { icon: Headphones, title: "Поддержка", text: "Помощь с активацией и настройкой" },
            ].map(({ icon: Icon, title, text }, i) => (
              <Reveal
                key={title}
                variant="scale"
                index={i + 4}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/60 p-5 backdrop-blur-sm transition-colors hover:border-[rgba(232,185,35,0.22)] lg:p-6"
              >
                <Icon className="mb-3 h-5 w-5 text-gold" aria-hidden />
                <h2 className="font-display font-semibold">{title}</h2>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <HomeStatsBar
        games={gamesCount}
        products={productsCount}
        reviews={reviewSummary.total}
        avgRating={reviewSummary.avgRating}
      />

      <section id="catalog" className="border-t border-[var(--color-border)] bg-[var(--color-bg-elevated)]/20">
        <div className="mx-auto max-w-6xl px-4 py-20 pb-16 sm:px-6 lg:py-24 lg:pb-20">
          <Reveal className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="section-label">Каталог</p>
              <h2 className="mt-2 font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">
                Каталог игр
              </h2>
              <p className="mt-3 max-w-xl text-[var(--color-text-secondary)]">
                Нажми на игру — откроется список товаров и подписок.
              </p>
            </div>
            <Link href="/catalog" className="group btn btn-ghost shrink-0">
              Весь каталог
              <ArrowRight className="arrow-nudge h-4 w-4" aria-hidden />
            </Link>
          </Reveal>

          <CatalogGrid items={items} />

          {items.length === 0 && (
            <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
              Каталог пуст. Добавь игры в{" "}
              <Link href="/admin/categories" className="text-gold hover:underline">
                админ-панели
              </Link>
              .
            </p>
          )}
        </div>
      </section>

      <HomeSteps />

      <HomeReviewsPreview
        reviews={recentReviews}
        avgRating={reviewSummary.avgRating}
        total={reviewSummary.total}
      />

      <HomeCta />
    </>
  );
}
