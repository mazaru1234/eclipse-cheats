import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getGameBySlug, getGameProductLines } from "@/lib/catalog";
import { getShopCurrencyContext } from "@/lib/currency-server";
import { ProductLineCard } from "@/components/shop/ProductLineCard";
import { Reveal } from "@/components/ui/Reveal";
import { gameGradient, gameInitials } from "@/lib/game-visuals";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const game = await getGameBySlug(slug);
  if (!game) return { title: "Игра не найдена" };
  return {
    title: `${game.name} — Eclipse Cheats`,
    description: game.description ?? `Товары для ${game.name}`,
  };
}

export default async function GameCatalogPage({ params }: PageProps) {
  const { slug } = await params;
  const game = await getGameBySlug(slug);
  if (!game) notFound();

  const [{ displayCurrency, rates }, lines] = await Promise.all([
    getShopCurrencyContext(),
    getGameProductLines(game.id),
  ]);

  return (
    <>
      <section className="site-container pt-8 pb-24">
        <Link
          href="/catalog"
          className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-gold transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          К каталогу игр
        </Link>

        <div
          className="relative mt-6 overflow-hidden rounded-2xl border border-[var(--color-border)] p-6 sm:p-10"
          style={{ background: gameGradient(game.id) }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(232,185,35,0.14),transparent_50%)]" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="section-label">Игра</p>
              <h1 className="mt-1 font-display text-4xl font-bold uppercase sm:text-5xl">{game.name}</h1>
              {game.description && (
                <p className="mt-3 max-w-2xl text-[var(--color-text-secondary)]">{game.description}</p>
              )}
              <p className="mt-4 text-sm text-[var(--color-text-muted)]">
                {lines.length}{" "}
                {lines.length === 1 ? "товар" : lines.length < 5 ? "товара" : "товаров"}
              </p>
            </div>
            <span
              className="font-display text-7xl font-bold text-white/10 select-none sm:text-8xl"
              aria-hidden
            >
              {gameInitials(game.name)}
            </span>
          </div>
        </div>

        {lines.length === 0 ? (
          <div className="card mt-8 py-16 text-center">
            <p className="text-[var(--color-text-secondary)]">Для этой игры пока нет товаров.</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {lines.map((line, i) => (
              <Reveal key={line.id} variant="scale" index={i}>
                <ProductLineCard
                  line={line}
                  gameSlug={game.slug}
                  gameName={game.name}
                  displayCurrency={displayCurrency}
                  eurRub={rates.eurRub}
                />
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
