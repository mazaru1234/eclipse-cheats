import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { supportTickets, ticketMessages, users } from "@/lib/db/schema";
import { eq, and, or, like, desc, asc, sql, count } from "drizzle-orm";
import type { SupportTicket, TicketMessage } from "@/lib/db/schema";

export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketPriority = "low" | "normal" | "high" | "urgent";
export type TicketReplyBy = "user" | "admin" | "system";
export type MessageRole = "user" | "admin" | "system";

export type TicketWithMeta = SupportTicket & {
  messageCount: number;
  username: string | null;
};

function generateTicketNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `EC-${ts}-${rnd}`;
}

export async function createTicket(data: {
  userId?: string | null;
  name: string;
  email: string;
  subject: string;
  message: string;
  priority?: TicketPriority;
}): Promise<SupportTicket> {
  const id = nanoid();
  const ticketNumber = generateTicketNumber();
  const now = new Date();
  const priority = data.priority || "normal";

  await db.insert(supportTickets).values({
    id,
    ticketNumber,
    userId: data.userId ?? null,
    name: data.name.trim(),
    email: data.email.trim(),
    subject: data.subject.trim(),
    message: data.message.trim(),
    status: "open",
    priority,
    lastReplyAt: now,
    lastReplyBy: "user",
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(ticketMessages).values({
    id: nanoid(),
    ticketId: id,
    role: "user",
    authorName: data.name.trim(),
    body: data.message.trim(),
    createdAt: now,
  });

  const [ticket] = await db.select().from(supportTickets).where(eq(supportTickets.id, id)).limit(1);
  if (!ticket) throw new Error("Не удалось создать тикет");
  return ticket;
}

export interface ListTicketsFilter {
  status?: TicketStatus | "all";
  priority?: TicketPriority;
  search?: string;
  userId?: string;
  limit?: number;
  offset?: number;
}

export async function listTickets(
  filter: ListTicketsFilter = {}
): Promise<{ rows: TicketWithMeta[]; total: number }> {
  const conditions = [];

  if (filter.status && filter.status !== "all") {
    conditions.push(eq(supportTickets.status, filter.status));
  }
  if (filter.priority) {
    conditions.push(eq(supportTickets.priority, filter.priority));
  }
  if (filter.userId) {
    conditions.push(eq(supportTickets.userId, filter.userId));
  }
  if (filter.search?.trim()) {
    const pattern = `%${filter.search.trim()}%`;
    conditions.push(
      or(
        like(supportTickets.ticketNumber, pattern),
        like(supportTickets.name, pattern),
        like(supportTickets.email, pattern),
        like(supportTickets.subject, pattern)
      )
    );
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;
  const limit = Math.min(200, Math.max(1, filter.limit ?? 50));
  const offset = Math.max(0, filter.offset ?? 0);

  const rows = await db
    .select({
      ticket: supportTickets,
      username: users.username,
      messageCount: sql<number>`(
        SELECT COUNT(*) FROM ticket_messages
        WHERE ticket_id = ${supportTickets.id}
      )`.mapWith(Number),
    })
    .from(supportTickets)
    .leftJoin(users, eq(users.id, supportTickets.userId))
    .where(whereClause)
    .orderBy(
      sql`CASE ${supportTickets.status}
        WHEN 'open' THEN 0
        WHEN 'in_progress' THEN 1
        WHEN 'resolved' THEN 2
        ELSE 3 END`,
      desc(sql`COALESCE(${supportTickets.lastReplyAt}, ${supportTickets.createdAt})`)
    )
    .limit(limit)
    .offset(offset);

  const [totalRow] = await db
    .select({ total: count() })
    .from(supportTickets)
    .where(whereClause);

  return {
    rows: rows.map((row) => ({
      ...row.ticket,
      username: row.username,
      messageCount: row.messageCount ?? 0,
    })),
    total: totalRow?.total ?? 0,
  };
}

export async function getTicketByNumber(ticketNumber: string): Promise<SupportTicket | null> {
  const [ticket] = await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.ticketNumber, ticketNumber))
    .limit(1);
  return ticket ?? null;
}

export async function getTicketById(id: string): Promise<SupportTicket | null> {
  const [ticket] = await db.select().from(supportTickets).where(eq(supportTickets.id, id)).limit(1);
  return ticket ?? null;
}

export async function getTicketsByUser(userId: string): Promise<TicketWithMeta[]> {
  const { rows } = await listTickets({ userId, limit: 100 });
  return rows;
}

export async function getTicketMessages(ticketId: string): Promise<TicketMessage[]> {
  return db
    .select()
    .from(ticketMessages)
    .where(eq(ticketMessages.ticketId, ticketId))
    .orderBy(asc(ticketMessages.createdAt), asc(ticketMessages.id));
}

export async function addTicketMessage(data: {
  ticketId: string;
  role: MessageRole;
  authorName: string;
  body: string;
  attachments?: string[] | null;
}): Promise<TicketMessage> {
  const now = new Date();
  const messageId = nanoid();
  const attachments =
    data.attachments && data.attachments.length > 0 ? JSON.stringify(data.attachments) : null;

  await db.insert(ticketMessages).values({
    id: messageId,
    ticketId: data.ticketId,
    role: data.role,
    authorName: data.authorName,
    body: data.body,
    attachments,
    createdAt: now,
  });

  if (data.role !== "system") {
    const [ticket] = await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.id, data.ticketId))
      .limit(1);

    if (ticket) {
      let nextStatus = ticket.status;
      if (data.role === "admin" && ticket.status === "open") {
        nextStatus = "in_progress";
      }
      if (data.role === "user" && ticket.status === "resolved") {
        nextStatus = "in_progress";
      }

      await db
        .update(supportTickets)
        .set({
          lastReplyAt: now,
          lastReplyBy: data.role,
          status: nextStatus,
          updatedAt: now,
        })
        .where(eq(supportTickets.id, data.ticketId));
    }
  }

  const [message] = await db
    .select()
    .from(ticketMessages)
    .where(eq(ticketMessages.id, messageId))
    .limit(1);

  if (!message) throw new Error("Не удалось сохранить сообщение");
  return message;
}

export async function updateTicketStatus(id: string, status: TicketStatus): Promise<boolean> {
  const result = await db
    .update(supportTickets)
    .set({ status, updatedAt: new Date() })
    .where(eq(supportTickets.id, id));
  return result.changes > 0;
}

export async function ticketStats(): Promise<{
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
  total: number;
}> {
  const rows = await db
    .select({
      status: supportTickets.status,
      count: count(),
    })
    .from(supportTickets)
    .groupBy(supportTickets.status);

  const out = { open: 0, in_progress: 0, resolved: 0, closed: 0, total: 0 };
  for (const row of rows) {
    out.total += row.count;
    if (row.status === "open") out.open = row.count;
    else if (row.status === "in_progress") out.in_progress = row.count;
    else if (row.status === "resolved") out.resolved = row.count;
    else if (row.status === "closed") out.closed = row.count;
  }
  return out;
}

export async function getTicketUserContext(userId: string | null) {
  if (!userId) return null;

  const [user] = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      balance: users.balance,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user ?? null;
}
