import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ticketStats } from "@/lib/services/tickets";
import { AdminShell } from "@/components/admin/AdminLayoutClient";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/");

  const tickets = await ticketStats();
  const openTicketCount = tickets.open + tickets.in_progress;

  return (
    <div className="admin-root">
      <AdminShell
        username={session.username}
        email={session.email}
        openTicketCount={openTicketCount}
      >
        {children}
      </AdminShell>
    </div>
  );
}
