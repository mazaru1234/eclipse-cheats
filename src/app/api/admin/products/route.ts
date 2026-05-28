import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getProductsForKeyImport } from "@/lib/services/keys";
import { listAdminProductLines } from "@/lib/services/admin-catalog";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);

    if (searchParams.get("legacy") === "tiers") {
      const products = await getProductsForKeyImport();
      return NextResponse.json({ products });
    }

    const result = await listAdminProductLines({
      categoryId: searchParams.get("categoryId") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      includeInactive: true,
      limit: Number(searchParams.get("limit") ?? 100),
    });

    return NextResponse.json({ products: result.rows, rows: result.rows, total: result.total });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
