import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getTicketsByUser } from "@/lib/services/tickets";

export async function GET() {
  try {
    const session = await requireAuth();
    const tickets = await getTicketsByUser(session.id);
    return NextResponse.json({ tickets });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
