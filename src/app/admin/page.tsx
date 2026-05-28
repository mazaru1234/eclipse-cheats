import Link from "next/link";
import { db } from "@/lib/db";
import { products, categories, orders, users, licenseKeys } from "@/lib/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { formatCurrency } from "@/lib/utils";
import { ticketStats } from "@/lib/services/tickets";
import {
  ArrowUpRight,
  Gamepad2,
  Key,
  MessageCircle,
  Package,
  ShoppingCart,
  Tag,
  Users,
  Wallet,
} from "lucide-react";

const STATUS_RU: Record<string, string> = {
  pending: "ожидание",
  paid: "оплачен",
  completed: "завершён",
  cancelled: "отменён",
  protected: "защищён",
};

export default async function AdminDashboard() {
  const [productCount] = await db.select({ count: sql<number>`count(*)` }).from(products);
  const [categoryCount] = await db.select({ count: sql<number>`count(*)` }).from(categories);
  const [orderCount] = await db.select({ count: sql<number>`count(*)` }).from(orders);
  const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
  const [availableKeys] = await db
    .select({ count: sql<number>`count(*)` })
    .from(licenseKeys)
    .where(eq(licenseKeys.status, "available"));

  const [revenue] = await db
    .select({ total: sql<number>`coalesce(sum(${orders.amount}), 0)` })
    .from(orders)
    .where(eq(orders.status, "completed"));

  const tickets = await ticketStats();
  const openTickets = tickets.open + tickets.in_progress;

  const recentOrders = await db
    .select({
      order: orders,
      product: products,
      user: users,
    })
    .from(orders)
    .innerJoin(products, eq(orders.productId, products.id))
    .innerJoin(users, eq(orders.userId, users.id))
    .orderBy(desc(orders.createdAt))
    .limit(6);

  const stats = [
    {
      label: "Выручка",
      value: formatCurrency(revenue?.total ?? 0),
      hint: "Завершённые заказы",
      icon: Wallet,
      accent: "#e8b923",
    },
    {
      label: "Заказы",
      value: String(orderCount?.count ?? 0),
      hint: "Всего в системе",
      icon: ShoppingCart,
      accent: "#22c55e",
    },
    {
      label: "Ключи в наличии",
      value: String(availableKeys?.count ?? 0),
      hint: "Готовы к выдаче",
      icon: Key,
      accent: "#67e8f9",
    },
    {
      label: "Открытые тикеты",
      value: String(openTickets),
      hint: "Нужен ответ",
      icon: MessageCircle,
      accent: openTickets > 0 ? "#ef4444" : "#71717a",
      href: "/admin/tickets",
    },
  ];

  const quickLinks = [
    { href: "/admin/products/new", label: "Новый товар", icon: Package },
    { href: "/admin/keys", label: "Импорт ключей", icon: Key },
    { href: "/admin/tickets", label: "Тикеты", icon: MessageCircle },
    { href: "/admin/promo-codes", label: "Промокоды", icon: Tag },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="section-label">Обзор магазина</p>
        <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-secondary)]">
          {categoryCount?.count ?? 0} категорий · {productCount?.count ?? 0} тарифов ·{" "}
          {userCount?.count ?? 0} пользователей
        </p>
      </div>

      <div className="admin-stat-grid">
        {stats.map(({ label, value, hint, icon: Icon, accent, href }) => {
          const card = (
            <div className="admin-stat-card h-full">
              <div
                className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-40"
                style={{ background: `radial-gradient(circle, ${accent}33 0%, transparent 70%)` }}
              />
              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                    {label}
                  </p>
                  <p className="mt-2 font-display text-3xl font-bold tabular-nums" style={{ color: accent }}>
                    {value}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">{hint}</p>
                </div>
                <div className="admin-stat-icon" style={{ color: accent, background: `${accent}18` }}>
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
              </div>
            </div>
          );

          return href ? (
            <Link key={label} href={href} className="block h-full">
              {card}
            </Link>
          ) : (
            <div key={label}>{card}</div>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h2 className="font-display text-lg font-bold">Последние заказы</h2>
              <p className="text-xs text-[var(--color-text-muted)]">Актуальная активность магазина</p>
            </div>
            <Link href="/admin/orders" className="btn btn-ghost py-2 text-xs">
              Все заказы
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Пользователь</th>
                  <th>Товар</th>
                  <th>Сумма</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-sm text-[var(--color-text-muted)]">
                      Заказов пока нет
                    </td>
                  </tr>
                ) : (
                  recentOrders.map(({ order, product, user }) => (
                    <tr key={order.id}>
                      <td>
                        <p className="font-medium">{user.username}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          {order.createdAt.toLocaleDateString("ru-RU")}
                        </p>
                      </td>
                      <td>{product.name}</td>
                      <td className="tabular-nums">{formatCurrency(order.amount)}</td>
                      <td>
                        <span className="badge badge-success">
                          {STATUS_RU[order.status] ?? order.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className="space-y-6">
          <section className="admin-panel p-5">
            <h2 className="font-display text-lg font-bold">Быстрые действия</h2>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">Частые операции администратора</p>
            <div className="admin-quick-grid mt-4">
              {quickLinks.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} className="admin-quick-link">
                  <Icon className="h-5 w-5 text-gold" aria-hidden />
                  <span className="text-sm font-medium">{label}</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="admin-panel p-5">
            <h2 className="font-display text-lg font-bold">Разделы</h2>
            <div className="mt-4 space-y-2">
              {[
                { href: "/admin/categories", label: "Категории игр", icon: Gamepad2, count: categoryCount?.count ?? 0 },
                { href: "/admin/products", label: "Товарные линейки", icon: Package, count: productCount?.count ?? 0 },
                { href: "/admin/users", label: "Пользователи", icon: Users, count: userCount?.count ?? 0 },
              ].map(({ href, label, icon: Icon, count }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex min-h-[44px] items-center justify-between rounded-xl border border-[var(--color-border)] px-3 py-2.5 transition-colors hover:border-[rgba(232,185,35,0.25)] hover:bg-[rgba(232,185,35,0.04)]"
                >
                  <span className="flex items-center gap-2 text-sm">
                    <Icon className="h-4 w-4 text-gold" aria-hidden />
                    {label}
                  </span>
                  <span className="text-sm tabular-nums text-[var(--color-text-muted)]">{count}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
