import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { addTicketMessage, getTicketById } from "@/lib/services/tickets";

const schema = z.object({
  body: z.string().min(1).max(5000),
});

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteProps) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    const ticket = await getTicketById(id);
    if (!ticket) return NextResponse.json({ error: "Тикет не найден" }, { status: 404 });
    if (ticket.status === "closed") {
      return NextResponse.json({ error: "Тикет закрыт" }, { status: 400 });
    }

    const body = schema.parse(await request.json());
    const message = await addTicketMessage({
      ticketId: ticket.id,
      role: "admin",
      authorName: session.username,
      body: body.body.trim(),
    });

    const updated = await getTicketById(id);
    return NextResponse.json({ message, ticket: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ошибка";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
