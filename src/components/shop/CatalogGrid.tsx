"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { GameCard } from "./GameCard";
import type { Category } from "@/lib/db/schema";

interface CatalogGridProps {
  items: { game: Category; productCount: number }[];
}

export function CatalogGrid({ items }: CatalogGridProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      ({ game }) =>
        game.name.toLowerCase().includes(q) ||
        game.slug.toLowerCase().includes(q) ||
        (game.description?.toLowerCase().includes(q) ?? false)
    );
  }, [items, query]);

  return (
    <>
      <label className="flex items-center gap-3 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] px-4 py-3.5 focus-within:border-[rgba(232,185,35,0.45)] focus-within:shadow-[0_0_0_3px_rgba(232,185,35,0.12)]">
        <Search className="h-5 w-5 shrink-0 text-[var(--color-text-muted)]" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск игры"
          className="min-w-0 flex-1 border-0 bg-transparent p-0 text-base shadow-none focus:shadow-none"
          aria-label="Поиск игры"
        />
      </label>

      {filtered.length === 0 ? (
        <div className="card mt-8 py-16 text-center">
          <p className="text-[var(--color-text-secondary)]">
            {query ? `По запросу «${query}» ничего не найдено` : "Каталог пуст"}
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map(({ game, productCount }) => (
            <GameCard key={game.id} game={game} productCount={productCount} />
          ))}
        </div>
      )}
    </>
  );
}
