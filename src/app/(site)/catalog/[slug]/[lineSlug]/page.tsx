import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  Cpu,
  Shield,
  Sparkles,
  Star,
  Usb,
  Zap,
} from "lucide-react";
import {
  getProductLineBySlug,
  getSimilarProductLines,
} from "@/lib/catalog";
import { getShopCurrencyContext } from "@/lib/currency-server";
import { formatPrice } from "@/lib/currency";
import { ProductBuyCard } from "@/components/shop/ProductBuyCard";
import { ProductGallery } from "@/components/shop/ProductGallery";
import { ProductStatusBadge } from "@/components/shop/ProductStatusBadge";
import { ProductAccordions } from "@/components/shop/ProductAccordions";
import { ProductLineCard } from "@/components/shop/ProductLineCard";
import { ReviewsSection } from "@/components/reviews/ReviewsSection";
import { getSession } from "@/lib/auth";
import {
  getApprovedReviewsForLine,
  getReviewSummary,
  canUserReviewLine,
} from "@/lib/services/reviews";

interface PageProps {
  params: Promise<{ slug: string; lineSlug: string }>;
  searchParams: Promise<{ d?: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug, lineSlug } = await params;
  const data = await getProductLineBySlug(slug, lineSlug);
  if (!data) return { title: "Товар не найден" };
  return {
    title: `${data.line.name} — ${data.game.name} | Eclipse Cheats`,
    description: data.line.description ?? `Купить ${data.line.name} для ${data.game.name}`,
  };
}

function RatingBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
        <span>{label}</span>
        <span>{value}/5</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--color-bg-elevated)]">
        <div className="h-full rounded-full" style={{ width: `${(value / 5) * 100}%`, background: color }} />
      </div>
    </div>
  );
}

export default async function ProductLinePage({ params, searchParams }: PageProps) {
  const { slug, lineSlug } = await params;
  const { d } = await searchParams;
  const preferredDays = d ? Number(d) : null;
  const data = await getProductLineBySlug(slug, lineSlug);
  if (!data) notFound();

  const { game, line } = data;
  const similar = await getSimilarProductLines(game.id, line.id);
  const session = await getSession();
  const [reviews, summary, reviewAccess] = await Promise.all([
    getApprovedReviewsForLine(line.id),
    getReviewSummary(line.id),
    session ? canUserReviewLine(session.id, line.id) : Promise.resolve({ canReview: false as const, reason: "login" as const }),
  ]);
  const minPrice = Math.min(...line.tiers.map((tier) => tier.price));
  const { displayCurrency, rates } = await getShopCurrencyContext();
  const minPriceLabel = formatPrice(minPrice, displayCurrency, rates.eurRub);

  const featureAccordionItems = line.featureGroups.map((group) => ({
    title: group.name,
    content: group.items,
  }));

  const accordionItems = [
    ...featureAccordionItems,
    {
      title: "Системные требования",
      content:
        line.systemRequirements.length > 0
          ? line.systemRequirements
          : [
              "Windows 10 / 11 x64",
              "8 GB RAM",
              "Поддерживаемая версия игры",
              "Отключён SmartScreen / антивирус для установки",
            ],
    },
  ];

  return (
    <>
      <section className="site-container pt-8 pb-24">
        <nav className="flex flex-wrap items-center gap-2 text-sm text-[var(--color-text-muted)]">
          <Link href="/" className="hover:text-gold transition-colors">
            Главная
          </Link>
          <span>/</span>
          <Link href={`/catalog/${game.slug}`} className="hover:text-gold transition-colors">
            {game.name}
          </Link>
          <span>/</span>
          <span className="text-[var(--color-text-secondary)]">{line.name}</span>
        </nav>

        <Link
          href={`/catalog/${game.slug}`}
          className="mt-4 inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-gold transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          К товарам {game.name}
        </Link>

        <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
          <div className="space-y-6 min-w-0">
            <div>
              <p className="section-label">{game.name}</p>
              <h1 className="mt-2 font-display text-3xl font-bold uppercase leading-tight sm:text-4xl">
                {line.name}
              </h1>
              <p className="mt-4 max-w-2xl text-[var(--color-text-secondary)] leading-relaxed">
                {line.longDescription ?? line.description ?? `Лучший софт для ${game.name} от ${minPriceLabel}.`}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <ProductStatusBadge status={line.status} />
                <span className="badge border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.06)]">
                  <Zap className="h-3.5 w-3.5 text-gold" aria-hidden />
                  INSTANT DELIVERY
                </span>
                <span className="badge border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.06)]">
                  <Star className="h-3.5 w-3.5 text-gold" aria-hidden />
                  TOP RATED
                </span>
              </div>
            </div>

            <ProductGallery title={line.name} images={line.gallery} fallbackId={line.id} />

            <div className="card p-5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-gold" aria-hidden />
                <h2 className="font-display text-xl font-bold">Описание</h2>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                {line.longDescription ?? line.description ?? "Подробное описание скоро будет добавлено."}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="card p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                  <Usb className="h-4 w-4" aria-hidden />
                  USB флешка
                </div>
                <p className="mt-3 font-medium">{line.needsUsb ? "Нужна" : "Не нужен"}</p>
              </div>
              <div className="card p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                  <Cpu className="h-4 w-4" aria-hidden />
                  Спуфер HWID
                </div>
                <p className="mt-3 font-medium">{line.hasSpoofer ? "Есть" : "Нету"}</p>
              </div>
              <RatingBar label="Безопасность" value={line.safetyRating} color="#22c55e" />
              <RatingBar label="Функционал" value={line.functionalityRating} color="#e8b923" />
            </div>

            <ProductAccordions items={accordionItems} />

            <ReviewsSection
              productLineId={line.id}
              lineName={line.name}
              initialReviews={reviews}
              initialSummary={summary}
              canReview={reviewAccess.canReview}
              reviewReason={reviewAccess.canReview ? null : reviewAccess.reason}
              isLoggedIn={!!session}
            />
          </div>

          <aside className="space-y-4 xl:sticky xl:top-[5.75rem] xl:self-start">
            <ProductBuyCard
              lineName={line.name}
              gameName={game.name}
              tiers={line.tiers}
              initialDurationDays={Number.isFinite(preferredDays) ? preferredDays : null}
            />

            <div className="grid grid-cols-2 gap-3">
              <div className="card p-4">
                <Zap className="h-4 w-4 text-gold" aria-hidden />
                <p className="mt-2 text-sm font-medium">Мгновенно</p>
                <p className="text-xs text-[var(--color-text-muted)]">Автовыдача ключа</p>
              </div>
              <div className="card p-4">
                <Shield className="h-4 w-4 text-gold" aria-hidden />
                <p className="mt-2 text-sm font-medium">Защита заказа</p>
                <p className="text-xs text-[var(--color-text-muted)]">Anti-fraud token</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="btn btn-ghost py-3 text-xs">
                Discord
              </a>
              <a href="https://t.me/EclipseHacksss" target="_blank" rel="noopener noreferrer" className="btn btn-ghost py-3 text-xs">
                Telegram
              </a>
            </div>
          </aside>
        </div>

        {similar.length > 0 && (
          <section className="mt-16">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="section-label">Похожие товары</p>
                <h2 className="font-display text-2xl font-bold">Другие читы для {game.name}</h2>
              </div>
              <Link
                href={`/catalog/${game.slug}`}
                className="inline-flex items-center gap-1 text-sm text-[var(--color-text-muted)] hover:text-gold"
              >
                Все товары
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {similar.map((item) => (
                <ProductLineCard
                  key={item.id}
                  line={item}
                  gameSlug={game.slug}
                  gameName={game.name}
                  displayCurrency={displayCurrency}
                  eurRub={rates.eurRub}
                />
              ))}
            </div>
          </section>
        )}
      </section>
    </>
  );
}
