import Link from "next/link";
import { getGamesWithProductCounts } from "@/lib/catalog";
import { CatalogGrid } from "@/components/shop/CatalogGrid";

export const metadata = {
  title: "Каталог игр — Eclipse Cheats",
  description: "Выберите игру и смотрите доступные подписки",
};

export default async function CatalogPage() {
  const items = await getGamesWithProductCounts();

  return (
    <>
      <section className="relative overflow-hidden border-b border-[var(--color-border)]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(232,185,35,0.08),transparent)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <p className="section-label">Магазин</p>
          <h1 className="mt-3 font-display text-4xl font-bold uppercase tracking-tight sm:text-5xl">
            Каталог игр
          </h1>
          <p className="mt-4 max-w-2xl text-[var(--color-text-secondary)]">
            Большой выбор игр — нажми на карточку, чтобы посмотреть товары и подписки внутри.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 pb-24 sm:px-6">
        <CatalogGrid items={items} />

        {items.length === 0 && (
          <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
            Добавь игры и товары в{" "}
            <Link href="/admin/categories" className="text-gold hover:underline">
              админ-панели
            </Link>
          </p>
        )}
      </section>
    </>
  );
}
