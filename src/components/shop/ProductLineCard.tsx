import Link from "next/link";
import { ArrowUpRight, Shield, Star } from "lucide-react";
import { gameGradient } from "@/lib/game-visuals";
import type { ProductLineWithMeta } from "@/lib/catalog";
import { ProductStatusBadge } from "@/components/shop/ProductStatusBadge";
import { ProductLineTierFooter } from "@/components/shop/ProductLineTierFooter";
import type { DisplayCurrency } from "@/lib/currency";

interface ProductLineCardProps {
  line: ProductLineWithMeta;
  gameSlug: string;
  gameName: string;
  displayCurrency: DisplayCurrency;
  eurRub: number;
}

export function ProductLineCard({
  line,
  gameSlug,
  gameName,
  displayCurrency,
  eurRub,
}: ProductLineCardProps) {
  const href = `/catalog/${gameSlug}/${line.slug}`;

  return (
    <article className="group card card-hover overflow-hidden">
      <Link href={href} prefetch className="block active:opacity-80">
        <div
          className="relative h-52 overflow-hidden"
          style={{
            background: line.imageUrl
              ? `url(${line.imageUrl}) center/cover`
              : gameGradient(line.id),
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(232,185,35,0.12),transparent_55%)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(3,3,4,0.96)] via-[rgba(3,3,4,0.35)] to-[rgba(3,3,4,0.15)]" />

          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {line.safetyRating >= 4 && (
              <span className="inline-flex items-center gap-1 rounded-md border border-[rgba(249,115,22,0.35)] bg-[rgba(249,115,22,0.15)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange-300">
                <Star className="h-3 w-3 fill-current" aria-hidden />
                TOP
              </span>
            )}
            {line.inStock && (
              <span className="inline-flex items-center gap-1 rounded-md border border-[rgba(34,197,94,0.35)] bg-[rgba(34,197,94,0.12)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--color-success)]">
                <Shield className="h-3 w-3" aria-hidden />
                TRUST
              </span>
            )}
          </div>

          <ProductStatusBadge
            status={line.status}
            className="absolute right-3 top-3 text-[10px]"
          />

          <div className="absolute inset-x-0 bottom-0 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold/80">Продукт</p>
            <h3 className="mt-1 font-display text-xl font-bold uppercase leading-tight tracking-wide text-white drop-shadow-lg sm:text-2xl">
              {line.name}
            </h3>
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-2.5">
          <span className="inline-flex items-center rounded-md border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-text-secondary)]">
            {gameName}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)] group-hover:text-gold">
            Подробнее
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </span>
        </div>
      </Link>

      <ProductLineTierFooter
        tiers={line.tiers}
        href={href}
        displayCurrency={displayCurrency}
        eurRub={eurRub}
        inStock={line.inStock}
      />
    </article>
  );
}
