import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { gameGradient, gameInitials } from "@/lib/game-visuals";
import type { Category } from "@/lib/db/schema";

interface GameCardProps {
  game: Category;
  productCount: number;
}

export function GameCard({ game, productCount }: GameCardProps) {
  return (
    <Link
      href={`/catalog/${game.slug}`}
      prefetch
      className="group card card-hover block overflow-hidden transition-opacity active:opacity-80"
    >
      <div className="relative h-44 overflow-hidden" style={{ background: gameGradient(game.id) }}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(232,185,35,0.15),transparent_55%)]" />
        <span className="absolute left-4 top-4 badge badge-gold">HOT</span>
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <span className="font-display text-3xl font-bold uppercase tracking-wide text-white/90 text-center drop-shadow-lg sm:text-4xl">
            {game.name}
          </span>
        </div>
        <span
          className="absolute right-4 top-4 font-display text-4xl font-bold text-white/10 select-none"
          aria-hidden
        >
          {gameInitials(game.name)}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-[var(--color-border)] bg-[var(--color-bg-elevated)]/80 p-4">
        <div className="min-w-0">
          <p className="truncate font-medium">{game.name}</p>
          <p className="text-sm text-[var(--color-text-muted)]">
            {productCount} {productCount === 1 ? "продукт" : productCount < 5 ? "продукта" : "продуктов"}
          </p>
        </div>
        <span className="btn btn-ghost shrink-0 px-3 py-2 text-sm group-hover:border-[rgba(232,185,35,0.35)] group-hover:text-gold">
          Перейти
          <ArrowUpRight className="h-4 w-4" aria-hidden />
        </span>
      </div>
    </Link>
  );
}
