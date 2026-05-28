"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CreditCard,
  Key,
  LayoutDashboard,
  MessageSquare,
  ShoppingBag,
  Tag,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/profile", label: "Дашборд", icon: LayoutDashboard, exact: true },
  { href: "/profile/deposits", label: "Пополнения", icon: Wallet },
  { href: "/profile/orders", label: "Мои покупки", icon: ShoppingBag },
  { href: "/profile/keys", label: "Мои ключи", icon: Key },
  { href: "/profile/promo", label: "Промокоды", icon: Tag },
  { href: "/profile/tickets", label: "Поддержка", icon: MessageSquare },
  { href: "/profile/topup", label: "Пополнить баланс", icon: CreditCard },
];

export function ProfileShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <aside className="shrink-0 lg:w-60">
          <p className="section-label mb-3 lg:hidden">Личный кабинет</p>
          <nav
            className="card flex gap-1 overflow-x-auto p-2 lg:flex-col lg:overflow-visible"
            aria-label="Разделы профиля"
          >
            {NAV.map(({ href, label, icon: Icon, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                    active
                      ? "bg-[rgba(232,185,35,0.12)] font-semibold text-gold"
                      : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text)]"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="whitespace-nowrap">{label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
