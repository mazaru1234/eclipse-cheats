import { getSession } from "@/lib/auth";
import { SupportTicketForm } from "@/components/support/SupportTicketForm";
import { Headphones, MessageSquare } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Поддержка | Eclipse Cheats",
  description: "Создайте тикет — мы ответим в личном кабинете",
};

export default async function SupportPage() {
  const session = await getSession();

  return (
    <div className="site-container max-w-3xl py-10">
      <p className="section-label">Поддержка</p>
      <h1 className="font-display text-4xl font-bold uppercase">Служба поддержки</h1>
      <p className="mt-3 text-[var(--color-text-secondary)]">
        Опишите проблему — мы ответим в чате тикета. Среднее время ответа — до 24 часов.
      </p>

      {session && (
        <Link
          href="/profile/tickets"
          className="mt-4 inline-flex items-center gap-2 text-sm text-gold hover:underline"
        >
          <MessageSquare className="h-4 w-4" />
          Мои тикеты
        </Link>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { icon: Headphones, title: "Чат-тикеты", text: "Переписка в профиле, как в мессенджере" },
          { icon: MessageSquare, title: "Номер тикета", text: "Сохраните номер EC-… после создания" },
          { icon: Headphones, title: "Статусы", text: "Открыт → В работе → Решён → Закрыт" },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title} className="card p-4">
            <Icon className="h-5 w-5 text-gold" aria-hidden />
            <p className="mt-3 font-medium">{title}</p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">{text}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <SupportTicketForm
          defaultName={session?.username}
          defaultEmail={session?.email}
          loggedIn={!!session}
        />
      </div>
    </div>
  );
}
