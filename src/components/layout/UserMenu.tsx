"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  LogOut,
  LayoutDashboard,
  Wallet,
  ShoppingBag,
  Key,
  Tag,
  CreditCard,
  MessageSquare,
} from "lucide-react";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { cn } from "@/lib/utils";

interface UserMenuProps {
  username: string;
  email: string;
  balance: number;
  isAdmin?: boolean;
}

const MENU_LINKS = [
  { href: "/profile", label: "Дашборд", icon: LayoutDashboard },
  { href: "/profile/deposits", label: "Пополнения", icon: Wallet },
  { href: "/profile/orders", label: "Мои покупки", icon: ShoppingBag },
  { href: "/profile/keys", label: "Мои ключи", icon: Key },
  { href: "/profile/promo", label: "Промокоды", icon: Tag },
  { href: "/profile/tickets", label: "Поддержка", icon: MessageSquare },
  { href: "/profile/topup", label: "Пополнить баланс", icon: CreditCard },
];

export function UserMenu({ username, email, balance, isAdmin }: UserMenuProps) {
  const router = useRouter();
  const { formatPrice } = useCurrency();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
          open
            ? "border-[rgba(232,185,35,0.4)] bg-[var(--color-bg-elevated)] text-[var(--color-text)]"
            : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[rgba(232,185,35,0.25)] hover:text-[var(--color-text)]"
        )}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span className="max-w-[120px] truncate font-medium">{username}</span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} aria-hidden />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-[200] w-[min(100vw-2rem,340px)] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
          <div className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] p-4">
            <div className="min-w-0">
              <p className="truncate font-semibold">{username}</p>
              <p className="truncate text-xs text-[var(--color-text-muted)]">{email}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="shrink-0 rounded-lg border border-[var(--color-border)] p-2 text-[var(--color-text-secondary)] hover:border-[var(--color-danger)] hover:text-[var(--color-danger)] transition-colors"
              aria-label="Выйти"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

          <div className="border-b border-[var(--color-border)] px-4 py-3 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-[var(--color-text-muted)]">Мой баланс:</span>
              <span className="font-semibold tabular-nums text-gold">{formatPrice(balance)}</span>
            </div>
          </div>

          <nav className="p-2" aria-label="Меню профиля">
            {MENU_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text)]"
              >
                <Icon className="h-4 w-4 opacity-70" aria-hidden />
                {label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gold transition-colors hover:bg-[rgba(232,185,35,0.08)]"
              >
                <LayoutDashboard className="h-4 w-4" aria-hidden />
                Админ-панель
              </Link>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}
