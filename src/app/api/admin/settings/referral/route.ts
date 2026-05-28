import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getReferralSettings, updateReferralSettings } from "@/lib/services/referral-settings";

const settingsSchema = z.object({
  enabled: z.boolean(),
  friendDiscountType: z.enum(["fixed", "percent"]),
  friendDiscountRub: z.number().min(0),
  friendDiscountUsd: z.number().min(0),
  referrerBonusType: z.enum(["fixed", "percent"]),
  referrerBonusRub: z.number().min(0),
  referrerBonusUsd: z.number().min(0),
  dynamicRankBonus: z.boolean(),
  recurrentBonus: z.boolean(),
  monthlyReferralLimit: z.number().int().min(0),
  bonusValidityDays: z.number().int().min(0),
  payoutDelayDays: z.number().int().min(0),
  maxReferralsPerIP: z.number().int().min(0),
  blockedEmailDomains: z.string(),
});

export async function GET() {
  try {
    await requireAdmin();
    const settings = await getReferralSettings();
    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const body = settingsSchema.parse(await request.json());
    const settings = await updateReferralSettings(body);
    return NextResponse.json(settings);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Save failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
