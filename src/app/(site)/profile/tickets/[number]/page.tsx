import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getTicketByNumber, getTicketMessages } from "@/lib/services/tickets";
import { UserTicketChat } from "@/components/support/UserTicketChat";

interface PageProps {
  params: Promise<{ number: string }>;
}

export default async function ProfileTicketPage({ params }: PageProps) {
  const session = await getSession();
  const { number } = await params;
  const ticket = await getTicketByNumber(number);
  if (!ticket) notFound();

  const ownsTicket =
    (ticket.userId && ticket.userId === session!.id) ||
    ticket.email.toLowerCase() === session!.email.toLowerCase();

  if (!ownsTicket) notFound();

  const messages = await getTicketMessages(ticket.id);

  return <UserTicketChat ticket={ticket} initialMessages={messages} />;
}
