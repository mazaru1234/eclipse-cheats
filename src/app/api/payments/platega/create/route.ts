import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { createDepositPayment } from "@/lib/services/payments";
import { getAppUrl } from "@/lib/env";

const schema = z.object({
  amountRub: z.number().min(1),
  method: z.enum(["sbp", "card", "intl", "crypto", "auto"]),
});

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = schema.parse(await request.json());

    const appUrl = getAppUrl();

    const result = await createDepositPayment({
      userId: session.id,
      amountRub: body.amountRub,
      method: body.method,
      appUrl,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ошибка создания платежа";
    const status = message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
