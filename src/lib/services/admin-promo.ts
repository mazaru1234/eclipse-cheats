import { db } from "@/lib/db";
import { promoCodes } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

export type AdminPromoCodeRow = {
  id: string;
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  maxUses: number | null;
  usedCount: number;
  minOrderAmount: number;
  expiresAt: Date | null;
  isActive: boolean;
};

export async function getAdminPromoCodes(): Promise<AdminPromoCodeRow[]> {
  const rows = await db.select().from(promoCodes).orderBy(desc(promoCodes.createdAt));
  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    discountType: row.discountType,
    discountValue: row.discountValue,
    maxUses: row.maxUses,
    usedCount: row.usedCount,
    minOrderAmount: row.minOrderAmount,
    expiresAt: row.expiresAt,
    isActive: row.isActive,
  }));
}

export async function getAdminPromoCodeById(id: string): Promise<AdminPromoCodeRow | null> {
  const [row] = await db.select().from(promoCodes).where(eq(promoCodes.id, id)).limit(1);
  if (!row) return null;
  return {
    id: row.id,
    code: row.code,
    discountType: row.discountType,
    discountValue: row.discountValue,
    maxUses: row.maxUses,
    usedCount: row.usedCount,
    minOrderAmount: row.minOrderAmount,
    expiresAt: row.expiresAt,
    isActive: row.isActive,
  };
}
