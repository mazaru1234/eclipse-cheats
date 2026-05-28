import { Suspense } from "react";
import { TopUpForm } from "@/components/profile/TopUpForm";

export const metadata = {
  title: "Пополнение баланса — Eclipse Cheats",
};

export default function TopUpPage() {
  return (
    <>
      <p className="section-label">Platega</p>
      <h1 className="mt-2 font-display text-3xl font-bold">Пополнение баланса</h1>
      <p className="mt-2 text-[var(--color-text-secondary)]">
        Выберите сумму и способ оплаты через Platega
      </p>

      <div className="mt-8">
        <Suspense fallback={<div className="card p-8">Загрузка...</div>}>
          <TopUpForm />
        </Suspense>
      </div>
    </>
  );
}
