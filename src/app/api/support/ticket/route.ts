import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { createTicket } from "@/lib/services/tickets";
import { enforceRateLimit } from "@/lib/security";

const schema = z.object({
  name: z.string().min(1).max(60),
  email: z.string().email().max(120),
  subject: z.string().min(1).max(120),
  message: z.string().min(10).max(5000),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
});

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "support-ticket", 5, 60_000);
  if (limited) return limited;

  try {
    const session = await getSession();
    const body = schema.parse(await request.json());

    const ticket = await createTicket({
      userId: session?.id ?? null,
      name: session?.username ?? body.name,
      email: session?.email ?? body.email,
      subject: body.subject,
      message: body.message,
      priority: body.priority,
    });

    return NextResponse.json({
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось создать тикет";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
