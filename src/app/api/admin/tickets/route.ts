import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { listTickets, ticketStats } from "@/lib/services/tickets";
import type { TicketPriority, TicketStatus } from "@/lib/services/tickets";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const status = (searchParams.get("status") || "open") as TicketStatus | "all";
    const priority = searchParams.get("priority") as TicketPriority | null;
    const search = searchParams.get("search") || undefined;

    const [{ rows, total }, stats] = await Promise.all([
      listTickets({
        status,
        priority: priority || undefined,
        search,
        limit: 100,
      }),
      ticketStats(),
    ]);

    return NextResponse.json({ rows, total, stats });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
