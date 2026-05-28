import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/security";
import { getDecryptedKeyForOrder } from "@/lib/services/shop";

export async function GET(request: Request) {
  const limited = enforceRateLimit(request, "order-verify", 20, 60_000);
  if (limited) return limited;

  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");
    const token = searchParams.get("token");

    if (!orderId || !token) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const key = await getDecryptedKeyForOrder(orderId, session.id, token);
    return NextResponse.json({ licenseKey: key, orderId, protectionVerified: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Verification failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
