import { NextResponse } from "next/server";
import {
  getActiveGames,
  getGamesWithProductCounts,
  getGameBySlug,
  getGameProductLines,
} from "@/lib/catalog";
import { enforceRateLimit } from "@/lib/security";

function serializeGame(game: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  createdAt: Date;
}) {
  return {
    id: game.id,
    name: game.name,
    slug: game.slug,
    description: game.description,
    imageUrl: game.imageUrl,
    sortOrder: game.sortOrder,
    createdAt: game.createdAt.toISOString(),
    url: `/catalog/${game.slug}`,
  };
}

function serializeLine(line: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  minPrice: number;
  maxPrice: number;
  tierCount: number;
  inStock: boolean;
  safetyRating: number;
  functionalityRating: number;
  sortOrder: number;
}) {
  return {
    id: line.id,
    name: line.name,
    slug: line.slug,
    description: line.description,
    imageUrl: line.imageUrl,
    minPrice: line.minPrice,
    maxPrice: line.maxPrice,
    tierCount: line.tierCount,
    inStock: line.inStock,
    safetyRating: line.safetyRating,
    functionalityRating: line.functionalityRating,
    sortOrder: line.sortOrder,
    url: null as string | null,
  };
}

export async function GET(request: Request) {
  const limited = enforceRateLimit(request, "games-api", 60, 60_000);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  const includeEmpty = searchParams.get("includeEmpty") === "true";

  if (slug) {
    const game = await getGameBySlug(slug);
    if (!game) {
      return NextResponse.json({ error: "Игра не найдена" }, { status: 404 });
    }

    const lines = await getGameProductLines(game.id);
    const gameData = serializeGame(game);

    return NextResponse.json({
      game: gameData,
      lines: lines.map((line) => ({
        ...serializeLine(line),
        url: `/catalog/${game.slug}/${line.slug}`,
      })),
    });
  }

  if (includeEmpty) {
    const [allGames, withCounts] = await Promise.all([
      getActiveGames(),
      getGamesWithProductCounts(),
    ]);
    const countMap = new Map(withCounts.map((row) => [row.game.id, row.productCount]));

    return NextResponse.json({
      games: allGames.map((game) => ({
        ...serializeGame(game),
        productCount: countMap.get(game.id) ?? 0,
      })),
    });
  }

  const rows = await getGamesWithProductCounts();

  return NextResponse.json({
    games: rows.map(({ game, productCount }) => ({
      ...serializeGame(game),
      productCount,
    })),
  });
}
