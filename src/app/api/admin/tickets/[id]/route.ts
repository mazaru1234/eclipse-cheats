import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import {
  getTicketById,
  getTicketMessages,
  getTicketUserContext,
  updateTicketStatus,
} from "@/lib/services/tickets";

const patchSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved", "closed"]),
});

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteProps) {
  try {
    await requireAdmin();
    const { id } = await params;
    const ticket = await getTicketById(id);
    if (!ticket) return NextResponse.json({ error: "Тикет не найден" }, { status: 404 });

    const [messages, user] = await Promise.all([
      getTicketMessages(ticket.id),
      getTicketUserContext(ticket.userId),
    ]);

    return NextResponse.json({ ticket, messages, user });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function PATCH(request: Request, { params }: RouteProps) {
  try {
    await requireAdmin();
    const { id } = await params;
    const ticket = await getTicketById(id);
    if (!ticket) return NextResponse.json({ error: "Тикет не найден" }, { status: 404 });

    const body = patchSchema.parse(await request.json());
    await updateTicketStatus(id, body.status);
    const updated = await getTicketById(id);
    return NextResponse.json({ ticket: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ошибка";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
