import { getSession } from "@/lib/auth";
import { getUserDeposits } from "@/lib/services/payments";
import { formatCurrency } from "@/lib/utils";

const STATUS: Record<string, string> = {
  pending: "ожидание",
  confirmed: "зачислено",
  canceled: "отменено",
};

export default async function DepositsPage() {
  const session = await getSession();
  const deposits = await getUserDeposits(session!.id);

  return (
    <>
      <h1 className="font-display text-3xl font-bold">Пополнения</h1>
      <div className="card mt-8 table-wrap p-1">
        {deposits.length === 0 ? (
          <p className="p-5 text-[var(--color-text-secondary)]">Пополнений пока нет.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Сумма</th>
                <th>Оплачено</th>
                <th>Статус</th>
                <th>Дата</th>
              </tr>
            </thead>
            <tbody>
              {deposits.map((d) => (
                <tr key={d.id}>
                  <td>{formatCurrency(d.amountRub)}</td>
                  <td>{d.payAmountRub.toFixed(2)} ₽</td>
                  <td>
                    <span className={`badge ${d.status === "confirmed" ? "badge-success" : d.status === "pending" ? "badge-warning" : "badge-danger"}`}>
                      {STATUS[d.status]}
                    </span>
                  </td>
                  <td>{d.createdAt.toLocaleDateString("ru-RU")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
