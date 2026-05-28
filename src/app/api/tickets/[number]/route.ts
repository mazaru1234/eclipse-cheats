import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import {
  addTicketMessage,
  getTicketByNumber,
  getTicketMessages,
  updateTicketStatus,
} from "@/lib/services/tickets";

const replySchema = z.object({
  body: z.string().min(1).max(5000),
});

const patchSchema = z.object({
  status: z.enum(["resolved"]),
});

interface RouteProps {
  params: Promise<{ number: string }>;
}

function canAccessTicket(
  ticket: { userId: string | null; email: string },
  session: { id: string; email: string; role: string }
) {
  if (session.role === "admin") return true;
  if (ticket.userId && ticket.userId === session.id) return true;
  return ticket.email.toLowerCase() === session.email.toLowerCase();
}

export async function GET(_request: Request, { params }: RouteProps) {
  try {
    const session = await requireAuth();
    const { number } = await params;
    const ticket = await getTicketByNumber(number);
    if (!ticket) return NextResponse.json({ error: "Тикет не найден" }, { status: 404 });
    if (!canAccessTicket(ticket, session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const messages = await getTicketMessages(ticket.id);
    return NextResponse.json({ ticket, messages });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request, { params }: RouteProps) {
  try {
    const session = await requireAuth();
    const { number } = await params;
    const ticket = await getTicketByNumber(number);
    if (!ticket) return NextResponse.json({ error: "Тикет не найден" }, { status: 404 });
    if (!canAccessTicket(ticket, session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (ticket.status === "closed") {
      return NextResponse.json({ error: "Тикет закрыт" }, { status: 400 });
    }

    const body = replySchema.parse(await request.json());
    const message = await addTicketMessage({
      ticketId: ticket.id,
      role: "user",
      authorName: session.username,
      body: body.body.trim(),
    });

    const updated = await getTicketByNumber(number);
    return NextResponse.json({ message, ticket: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ошибка";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request, { params }: RouteProps) {
  try {
    const session = await requireAuth();
    const { number } = await params;
    const ticket = await getTicketByNumber(number);
    if (!ticket) return NextResponse.json({ error: "Тикет не найден" }, { status: 404 });
    if (!canAccessTicket(ticket, session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = patchSchema.parse(await request.json());
    if (body.status === "resolved") {
      await updateTicketStatus(ticket.id, "resolved");
      await addTicketMessage({
        ticketId: ticket.id,
        role: "system",
        authorName: "Система",
        body: "Пользователь отметил проблему как решённую.",
      });
    }

    const updated = await getTicketByNumber(number);
    return NextResponse.json({ ticket: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ошибка";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
