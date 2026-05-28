import { NextResponse } from "next/server";
import { verifyPlategaCallbackHeaders } from "@/lib/platega";
import { confirmDeposit, cancelDeposit } from "@/lib/services/payments";
import { enforceRateLimit } from "@/lib/security";
import { db } from "@/lib/db";
import { paymentDeposits } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface CallbackBody {
  id: string;
  amount: number;
  currency: string;
  status: "CONFIRMED" | "CANCELED" | "CHARGEBACKED";
  paymentMethod?: number;
  payload?: string;
}

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "platega-webhook", 120, 60_000);
  if (limited) return limited;

  const merchantId = request.headers.get("X-MerchantId") ?? "";
  const secret = request.headers.get("X-Secret") ?? "";

  if (!verifyPlategaCallbackHeaders(merchantId, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as CallbackBody;
    let depositId: string | undefined;

    if (body.payload) {
      try {
        const parsed = JSON.parse(body.payload) as { depositId?: string };
        depositId = parsed.depositId;
      } catch {
        /* ignore */
      }
    }

    if (!depositId) {
      const [deposit] = await db
        .select()
        .from(paymentDeposits)
        .where(eq(paymentDeposits.plategaTransactionId, body.id))
        .limit(1);
      depositId = deposit?.id;
    }

    if (!depositId) {
      return NextResponse.json({ ok: true });
    }

    if (body.status === "CONFIRMED") {
      await confirmDeposit(depositId, body.id, body.amount);
    } else if (body.status === "CANCELED" || body.status === "CHARGEBACKED") {
      await cancelDeposit(body.id);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Platega webhook error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
