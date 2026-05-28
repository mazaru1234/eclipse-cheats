import { NextResponse } from "next/server";
import { getTopupSettings } from "@/lib/services/topup-settings";

export async function GET() {
  const settings = await getTopupSettings();
  return NextResponse.json({
    enabled: settings.enabled,
    minAmountRub: settings.minAmountRub,
    maxAmountRub: settings.maxAmountRub,
    feePercent: settings.feePercent,
    presetAmounts: settings.presetAmounts,
    userDailyLimitRub: settings.userDailyLimitRub,
    userDailyMaxCount: settings.userDailyMaxCount,
  });
}
