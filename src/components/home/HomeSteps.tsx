import { CreditCard, KeyRound, Search } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";

const STEPS = [
  {
    icon: Search,
    title: "Выберите игру",
    text: "Откройте каталог и подписку под ваши задачи",
  },
  {
    icon: CreditCard,
    title: "Оплатите с баланса",
    text: "Пополнение через Platega, покупка без комиссии",
  },
  {
    icon: KeyRound,
    title: "Получите ключ",
    text: "Лицензия выдаётся сразу после оплаты",
  },
] as const;

export function HomeSteps() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
      <Reveal className="mb-10 max-w-xl">
        <p className="section-label">Процесс</p>
        <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">Как это работает</h2>
        <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
          Три шага от выбора игры до готового ключа — без лишних форм и ожидания.
        </p>
      </Reveal>

      <ol className="grid gap-4 md:grid-cols-3">
        {STEPS.map(({ icon: Icon, title, text }, index) => (
          <Reveal
            as="li"
            key={title}
            index={index}
            className="relative rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)]/60 p-5 transition-colors hover:border-[rgba(232,185,35,0.22)]"
          >
            <span className="text-[11px] font-semibold tabular-nums text-[var(--color-text-muted)]">
              {String(index + 1).padStart(2, "0")}
            </span>
            <Icon className="mt-4 h-5 w-5 text-gold" aria-hidden />
            <h3 className="mt-3 font-display text-base font-semibold">{title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-text-secondary)]">{text}</p>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}
