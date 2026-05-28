import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { importLicenseKeys } from "@/lib/services/shop";
import { listAdminKeys, getProductsForKeyImport, getProductLinesForKeyImport } from "@/lib/services/keys";
import { db } from "@/lib/db";
import { licenseKeys } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

const importSchema = z.object({
  productId: z.string().min(1, "Выберите тариф"),
  keys: z.array(z.string()).min(1).max(200),
});

function formatImportError(error: unknown) {
  if (error instanceof Error) {
    if (/FOREIGN KEY constraint failed/i.test(error.message)) {
      return "Тариф не найден или был удалён. Обновите страницу, выберите тариф снова и повторите импорт.";
    }
    return error.message;
  }
  return "Import failed";
}

export const maxDuration = 120;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);

    if (searchParams.get("list") === "products") {
      const products = await getProductsForKeyImport();
      return NextResponse.json({ products });
    }

    if (searchParams.get("list") === "lines") {
      const lines = await getProductLinesForKeyImport();
      return NextResponse.json({ lines });
    }

    const result = await listAdminKeys({
      productId: searchParams.get("productId") ?? undefined,
      lineId: searchParams.get("lineId") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      sort: (searchParams.get("sort") as "newest" | "oldest" | "status") ?? "newest",
      limit: Number(searchParams.get("limit") ?? 20),
      offset: Number(searchParams.get("offset") ?? 0),
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = importSchema.parse(await request.json());
    const count = await importLicenseKeys(body.productId, body.keys);
    return NextResponse.json({ imported: count, skipped: 0 });
  } catch (error) {
    const message = formatImportError(error);
    const status =
      message.includes("AES_SECRET_KEY") ? 500 : message.includes("Too many") ? 413 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const [key] = await db
      .select()
      .from(licenseKeys)
      .where(and(eq(licenseKeys.id, id), eq(licenseKeys.status, "available")))
      .limit(1);

    if (!key) {
      return NextResponse.json({ error: "Key not found or already sold" }, { status: 400 });
    }

    await db.delete(licenseKeys).where(eq(licenseKeys.id, id));
    const { syncProductStock } = await import("@/lib/services/shop");
    await syncProductStock(key.productId);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 400 });
  }
}
