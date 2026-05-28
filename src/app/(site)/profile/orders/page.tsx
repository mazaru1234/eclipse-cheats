import { getSession } from "@/lib/auth";
import { getUserOrders } from "@/lib/services/shop";
import { formatCurrency } from "@/lib/utils";

const STATUS: Record<string, string> = {
  pending: "ожидание",
  paid: "оплачен",
  completed: "завершён",
  cancelled: "отменён",
  protected: "защищён",
};

export default async function OrdersPage() {
  const session = await getSession();
  const orders = await getUserOrders(session!.id);

  return (
    <>
      <h1 className="font-display text-3xl font-bold">Мои покупки</h1>
      <div className="card mt-8 table-wrap p-1">
        {orders.length === 0 ? (
          <p className="p-5 text-[var(--color-text-secondary)]">Покупок пока нет.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Товар</th>
                <th>Игра</th>
                <th>Сумма</th>
                <th>Статус</th>
                <th>Дата</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(({ order, product, game }) => (
                <tr key={order.id}>
                  <td>{product.name}</td>
                  <td>{game.name}</td>
                  <td>{formatCurrency(order.amount)}</td>
                  <td>
                    <span className="badge badge-success">{STATUS[order.status] ?? order.status}</span>
                  </td>
                  <td>{order.createdAt.toLocaleDateString("ru-RU")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
