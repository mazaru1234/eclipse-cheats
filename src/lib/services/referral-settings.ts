import { db } from "@/lib/db";
import { referralSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const DEFAULT_ID = "default";

export type SafeReferralSettings = {
  enabled: boolean;
  friendDiscountType: "fixed" | "percent";
  friendDiscountRub: number;
  friendDiscountUsd: number;
  referrerBonusType: "fixed" | "percent";
  referrerBonusRub: number;
  referrerBonusUsd: number;
  dynamicRankBonus: boolean;
  recurrentBonus: boolean;
  monthlyReferralLimit: number;
  bonusValidityDays: number;
  payoutDelayDays: number;
  maxReferralsPerIP: number;
  blockedEmailDomains: string;
};

function toSafe(row: typeof referralSettings.$inferSelect): SafeReferralSettings {
  return {
    enabled: row.enabled,
    friendDiscountType: row.friendDiscountType,
    friendDiscountRub: row.friendDiscountRub,
    friendDiscountUsd: row.friendDiscountUsd,
    referrerBonusType: row.referrerBonusType,
    referrerBonusRub: row.referrerBonusRub,
    referrerBonusUsd: row.referrerBonusUsd,
    dynamicRankBonus: row.dynamicRankBonus,
    recurrentBonus: row.recurrentBonus,
    monthlyReferralLimit: row.monthlyReferralLimit,
    bonusValidityDays: row.bonusValidityDays,
    payoutDelayDays: row.payoutDelayDays,
    maxReferralsPerIP: row.maxReferralsPerIP,
    blockedEmailDomains: row.blockedEmailDomains,
  };
}

export async function getReferralSettings(): Promise<SafeReferralSettings> {
  const [row] = await db
    .select()
    .from(referralSettings)
    .where(eq(referralSettings.id, DEFAULT_ID))
    .limit(1);

  if (row) return toSafe(row);

  await db.insert(referralSettings).values({ id: DEFAULT_ID });
  const [created] = await db
    .select()
    .from(referralSettings)
    .where(eq(referralSettings.id, DEFAULT_ID))
    .limit(1);

  return toSafe(created);
}

export async function updateReferralSettings(data: Partial<SafeReferralSettings>) {
  await getReferralSettings();

  const patch: Partial<typeof referralSettings.$inferInsert> = { updatedAt: new Date() };
  if (data.enabled !== undefined) patch.enabled = data.enabled;
  if (data.friendDiscountType !== undefined) patch.friendDiscountType = data.friendDiscountType;
  if (data.friendDiscountRub !== undefined) patch.friendDiscountRub = data.friendDiscountRub;
  if (data.friendDiscountUsd !== undefined) patch.friendDiscountUsd = data.friendDiscountUsd;
  if (data.referrerBonusType !== undefined) patch.referrerBonusType = data.referrerBonusType;
  if (data.referrerBonusRub !== undefined) patch.referrerBonusRub = data.referrerBonusRub;
  if (data.referrerBonusUsd !== undefined) patch.referrerBonusUsd = data.referrerBonusUsd;
  if (data.dynamicRankBonus !== undefined) patch.dynamicRankBonus = data.dynamicRankBonus;
  if (data.recurrentBonus !== undefined) patch.recurrentBonus = data.recurrentBonus;
  if (data.monthlyReferralLimit !== undefined) patch.monthlyReferralLimit = data.monthlyReferralLimit;
  if (data.bonusValidityDays !== undefined) patch.bonusValidityDays = data.bonusValidityDays;
  if (data.payoutDelayDays !== undefined) patch.payoutDelayDays = data.payoutDelayDays;
  if (data.maxReferralsPerIP !== undefined) patch.maxReferralsPerIP = data.maxReferralsPerIP;
  if (data.blockedEmailDomains !== undefined) patch.blockedEmailDomains = data.blockedEmailDomains;

  await db.update(referralSettings).set(patch).where(eq(referralSettings.id, DEFAULT_ID));

  return getReferralSettings();
}

export async function calculateReferrerBonus(orderAmountUsd: number): Promise<number> {
  const settings = await getReferralSettings();
  if (!settings.enabled) return 0;

  if (settings.referrerBonusType === "fixed") {
    return settings.referrerBonusUsd;
  }

  return (orderAmountUsd * settings.referrerBonusUsd) / 100;
}
