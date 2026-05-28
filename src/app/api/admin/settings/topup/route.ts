import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getTopupSettings, updateTopupSettings } from "@/lib/services/topup-settings";

const schema = z.object({
  enabled: z.boolean().optional(),
  minAmountRub: z.number().min(1).optional(),
  maxAmountRub: z.number().min(1).optional(),
  feePercent: z.number().min(0).max(50).optional(),
  presetAmounts: z.array(z.number().positive()).min(1).max(12).optional(),
  userDailyLimitRub: z.number().min(0).optional(),
  userDailyMaxCount: z.number().int().min(1).max(100).optional(),
  adminManualMaxRub: z.number().min(1).optional(),
  adminDailyLimitRub: z.number().min(1).optional(),
});

export async function GET() {
  try {
    await requireAdmin();
    const settings = await getTopupSettings();
    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const body = schema.parse(await request.json());

    if (
      body.minAmountRub != null &&
      body.maxAmountRub != null &&
      body.minAmountRub > body.maxAmountRub
    ) {
      return NextResponse.json(
        { error: "Минимум не может быть больше максимума" },
        { status: 400 }
      );
    }

    const settings = await updateTopupSettings(body);
    return NextResponse.json(settings);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ошибка сохранения";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
