import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getTicketsByUser } from "@/lib/services/tickets";
import { Plus } from "lucide-react";

const STATUS: Record<string, string> = {
  open: "Открыт",
  in_progress: "В работе",
  resolved: "Решён",
  closed: "Закрыт",
};

export default async function ProfileTicketsPage() {
  const session = await getSession();
  const tickets = await getTicketsByUser(session!.id);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Мои тикеты</h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Обращения в поддержку и переписка с операторами
          </p>
        </div>
        <Link href="/support" className="btn btn-primary inline-flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Новый тикет
        </Link>
      </div>

      <div className="card mt-8 table-wrap p-1">
        {tickets.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-[var(--color-text-secondary)]">У вас пока нет тикетов.</p>
            <Link href="/support" className="mt-3 inline-block text-sm text-gold hover:underline">
              Создать первое обращение
            </Link>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Номер</th>
                <th>Тема</th>
                <th>Статус</th>
                <th>Сообщений</th>
                <th>Обновлён</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td>
                    <Link
                      href={`/profile/tickets/${ticket.ticketNumber}`}
                      className="font-mono text-sm text-gold hover:underline"
                    >
                      #{ticket.ticketNumber}
                    </Link>
                  </td>
                  <td>{ticket.subject}</td>
                  <td>
                    <span className="badge badge-gold">{STATUS[ticket.status] ?? ticket.status}</span>
                  </td>
                  <td>{ticket.messageCount}</td>
                  <td>
                    {(ticket.lastReplyAt || ticket.createdAt).toLocaleDateString("ru-RU")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
