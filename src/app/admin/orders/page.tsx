import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { ArrowUpRight, Shield } from "lucide-react";
import { db } from "@/lib/db";
import { orders, products, users } from "@/lib/db/schema";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/admin/AdminPrimitives";

const STATUS_RU: Record<string, string> = {
  pending: "ожидание",
  paid: "оплачен",
  completed: "завершён",
  cancelled: "отменён",
  protected: "защищён",
};

export default async function AdminOrdersPage() {
  const items = await db
    .select({
      order: orders,
      product: products,
      user: users,
    })
    .from(orders)
    .innerJoin(products, eq(orders.productId, products.id))
    .innerJoin(users, eq(orders.userId, users.id))
    .orderBy(desc(orders.createdAt));

  return (
    <div>
      <PageHeader
        hideTitle
        title="Заказы"
        subtitle="Все покупки с защитой HMAC-SHA256"
        actions={
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-text-muted)]">
            <Shield className="h-3.5 w-3.5 text-gold" aria-hidden />
            Anti-fraud token
          </span>
        }
      />

      <div className="admin-panel table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Пользователь</th>
              <th>Товар</th>
              <th>Сумма</th>
              <th>Скидка</th>
              <th>Статус</th>
              <th>Дата</th>
            </tr>
          </thead>
          <tbody>
            {items.map(({ order, product, user }) => (
              <tr key={order.id}>
                <td className="font-mono text-xs text-[var(--color-text-muted)]">
                  {order.id.slice(0, 10)}…
                </td>
                <td>{user.username}</td>
                <td>{product.name}</td>
                <td className="tabular-nums">{formatCurrency(order.amount)}</td>
                <td className="tabular-nums">
                  {order.discountAmount > 0 ? formatCurrency(order.discountAmount) : "—"}
                </td>
                <td>
                  <span className="badge badge-success">{STATUS_RU[order.status] ?? order.status}</span>
                </td>
                <td className="text-sm text-[var(--color-text-muted)]">
                  {order.createdAt.toLocaleDateString("ru-RU")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <p className="py-10 text-center text-sm text-[var(--color-text-muted)]">Заказов пока нет</p>
        )}
      </div>

      {items.length > 0 && (
        <p className="mt-3 text-xs text-[var(--color-text-muted)]">
          Показано {items.length} заказов ·{" "}
          <Link href="/admin" className="inline-flex items-center gap-1 text-gold hover:underline">
            На дашборд
            <ArrowUpRight className="h-3 w-3" aria-hidden />
          </Link>
        </p>
      )}
    </div>
  );
}
