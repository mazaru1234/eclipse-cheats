import { listTickets, ticketStats } from "@/lib/services/tickets";
import { TicketsAdminClient } from "@/components/admin/TicketsAdminClient";

export default async function AdminTicketsPage() {
  const [{ rows }, stats] = await Promise.all([
    listTickets({ status: "open", limit: 100 }),
    ticketStats(),
  ]);

  return <TicketsAdminClient initialRows={rows} initialStats={stats} />;
}
