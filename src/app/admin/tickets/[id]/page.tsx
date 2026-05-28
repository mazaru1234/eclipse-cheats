import { notFound } from "next/navigation";
import {
  getTicketById,
  getTicketMessages,
  getTicketUserContext,
} from "@/lib/services/tickets";
import { TicketChatAdminClient } from "@/components/admin/TicketChatAdminClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminTicketPage({ params }: PageProps) {
  const { id } = await params;
  const ticket = await getTicketById(id);
  if (!ticket) notFound();

  const [messages, user] = await Promise.all([
    getTicketMessages(ticket.id),
    getTicketUserContext(ticket.userId),
  ]);

  return (
    <TicketChatAdminClient ticket={ticket} initialMessages={messages} user={user} />
  );
}
