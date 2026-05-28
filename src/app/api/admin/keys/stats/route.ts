import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getKeyStats } from "@/lib/services/keys";

export async function GET() {
  try {
    await requireAdmin();
    const stats = await getKeyStats();
    return NextResponse.json(stats);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
