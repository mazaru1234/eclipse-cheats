import Link from "next/link";
import { ArrowRight, Headphones } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";

export function HomeCta() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:pb-28">
      <Reveal
        variant="scale"
        className="flex flex-col items-start justify-between gap-6 rounded-2xl border border-[rgba(232,185,35,0.18)] bg-[rgba(232,185,35,0.04)] p-6 sm:flex-row sm:items-center sm:p-8"
      >
        <div>
          <p className="section-label">Поддержка</p>
          <h2 className="mt-2 font-display text-xl font-bold sm:text-2xl">Нужна помощь с покупкой?</h2>
          <p className="mt-2 max-w-md text-sm text-[var(--color-text-secondary)]">
            Ответим на вопросы по активации, тарифам и оплате — через тикет или Telegram.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/support" className="btn btn-primary py-2.5">
            <Headphones className="h-4 w-4" aria-hidden />
            Написать в поддержку
          </Link>
          <Link href="/register" className="group btn btn-ghost py-2.5">
            Создать аккаунт
            <ArrowRight className="arrow-nudge h-4 w-4" aria-hidden />
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
