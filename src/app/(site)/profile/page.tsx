import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  getUserOrders,
  getBalanceHistory,
  getReferralStats,
} from "@/lib/services/shop";
import { formatCurrency } from "@/lib/utils";
import { ProfileClient } from "@/components/profile/ProfileClient";
import { Wallet, Gift, ShoppingBag, MessageSquare, Shield } from "lucide-react";
import Link from "next/link";
import { getTicketsByUser } from "@/lib/services/tickets";

const STATUS_RU: Record<string, string> = {
  pending: "ожидание",
  paid: "оплачен",
  completed: "завершён",
  cancelled: "отменён",
  protected: "защищён",
};

const TX_RU: Record<string, string> = {
  deposit: "пополнение",
  purchase: "покупка",
  refund: "возврат",
  referral: "реферал",
  admin_adjustment: "корректировка",
};

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) return null;

  const [user] = await db.select().from(users).where(eq(users.id, session.id)).limit(1);
  if (!user) return null;

  const orders = await getUserOrders(session.id);
  const transactions = await getBalanceHistory(session.id);
  const referralStats = await getReferralStats(session.id);
  const tickets = await getTicketsByUser(session.id);
  const openTickets = tickets.filter((t) => t.status === "open" || t.status === "in_progress").length;

  return (
    <>
      <p className="section-label">Личный кабинет</p>
      <h1 className="mt-2 font-display text-3xl font-bold">Профиль</h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[rgba(232,185,35,0.1)]">
            <Wallet className="h-6 w-6 text-gold" aria-hidden />
          </div>
          <div>
            <p className="text-sm text-[var(--color-text-muted)]">Баланс</p>
            <p className="price-value price-value-md">{formatCurrency(user.balance)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[rgba(232,185,35,0.1)]">
            <Gift className="h-6 w-6 text-gold" aria-hidden />
          </div>
          <div>
            <p className="text-sm text-[var(--color-text-muted)]">С рефералов</p>
            <p className="price-value price-value-md">{formatCurrency(referralStats.totalEarned)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[rgba(34,197,94,0.1)]">
            <ShoppingBag className="h-6 w-6 text-[var(--color-success)]" aria-hidden />
          </div>
          <div>
            <p className="text-sm text-[var(--color-text-muted)]">Заказов</p>
            <p className="font-display text-2xl font-bold">{orders.length}</p>
          </div>
        </div>
        <Link href="/profile/tickets" className="card flex items-center gap-4 p-5 transition-colors hover:border-gold">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[rgba(232,185,35,0.1)]">
            <MessageSquare className="h-6 w-6 text-gold" aria-hidden />
          </div>
          <div>
            <p className="text-sm text-[var(--color-text-muted)]">Тикеты</p>
            <p className="font-display text-2xl font-bold">{openTickets > 0 ? openTickets : tickets.length}</p>
          </div>
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link href="/support" className="btn btn-ghost py-2 text-xs">
          Создать тикет
        </Link>
        <Link href="/profile/tickets" className="btn btn-ghost py-2 text-xs">
          Мои обращения
        </Link>
      </div>

      <ProfileClient
        referralCode={user.referralCode}
        username={user.username}
        email={user.email}
      />

      <section className="mt-12">
        <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold">
          <Shield className="h-5 w-5 text-gold" aria-hidden />
          История заказов
        </h2>
        <div className="card table-wrap p-1">
          {orders.length === 0 ? (
            <p className="p-5 text-[var(--color-text-secondary)]">Заказов пока нет.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Товар</th>
                  <th>Сумма</th>
                  <th>Статус</th>
                  <th>Дата</th>
                  <th>Токен</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(({ order, product, game }) => (
                  <tr key={order.id}>
                    <td>{game.name} — {product.name}</td>
                    <td className="tabular-nums">{formatCurrency(order.amount)}</td>
                    <td>
                      <span className="badge badge-success">{STATUS_RU[order.status] ?? order.status}</span>
                    </td>
                    <td>{order.createdAt.toLocaleDateString("ru-RU")}</td>
                    <td>
                      <code className="text-xs text-[var(--color-text-muted)]">
                        {order.protectionToken.slice(0, 10)}…
                      </code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="mt-12 pb-8">
        <h2 className="mb-4 font-display text-xl font-semibold">История баланса</h2>
        <div className="card table-wrap p-1">
          {transactions.length === 0 ? (
            <p className="p-5 text-[var(--color-text-secondary)]">Операций пока нет.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Тип</th>
                  <th>Сумма</th>
                  <th>Описание</th>
                  <th>Дата</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>{TX_RU[tx.type] ?? tx.type}</td>
                    <td className={`tabular-nums ${tx.amount >= 0 ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}`}>
                      {formatCurrency(tx.amount)}
                    </td>
                    <td>{tx.description}</td>
                    <td>{tx.createdAt.toLocaleDateString("ru-RU")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </>
  );
}
