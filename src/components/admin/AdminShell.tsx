"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Gamepad2,
  Key,
  Tag,
  Users,
  ShoppingCart,
  Gift,
  MessageCircle,
  CreditCard,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

const mobileLinks = [
  { href: "/admin", label: "Дашборд", exact: true },
  { href: "/admin/products", label: "Товары" },
  { href: "/admin/orders", label: "Заказы" },
  { href: "/admin/tickets", label: "Тикеты" },
  { href: "/admin/users", label: "Клиенты" },
];

const groups = [
  {
    label: "Обзор",
    items: [{ href: "/admin", label: "Дашборд", icon: LayoutDashboard, exact: true }],
  },
  {
    label: "Торговля",
    items: [
      { href: "/admin/categories", label: "Категории", icon: Gamepad2 },
      { href: "/admin/products", label: "Товары", icon: Package },
      { href: "/admin/keys", label: "Ключи", icon: Key },
      { href: "/admin/orders", label: "Заказы", icon: ShoppingCart },
    ],
  },
  {
    label: "Маркетинг",
    items: [{ href: "/admin/promo-codes", label: "Промокоды", icon: Tag }],
  },
  {
    label: "Клиенты",
    items: [
      { href: "/admin/users", label: "Пользователи", icon: Users },
      { href: "/admin/deposits", label: "Пополнения", icon: CreditCard },
      { href: "/admin/tickets", label: "Тикеты", icon: MessageCircle },
      { href: "/admin/reviews", label: "Отзывы", icon: Star },
    ],
  },
  {
    label: "Система",
    items: [
      { href: "/admin/settings/topup", label: "Пополнение", icon: CreditCard },
      { href: "/admin/settings/referral", label: "Реферальная программа", icon: Gift },
    ],
  },
];

const PAGE_TITLES: Record<string, string> = {
  "/admin": "Дашборд",
  "/admin/categories": "Категории",
  "/admin/products": "Товары",
  "/admin/keys": "Ключи",
  "/admin/orders": "Заказы",
  "/admin/promo-codes": "Промокоды",
  "/admin/users": "Пользователи",
  "/admin/deposits": "Пополнения",
  "/admin/tickets": "Тикеты",
  "/admin/reviews": "Отзывы",
  "/admin/settings/topup": "Настройки пополнения",
  "/admin/settings/referral": "Реферальная программа",
};

function getPageTitle(pathname: string) {
  if (pathname.startsWith("/admin/products/")) return "Товар";
  if (pathname.startsWith("/admin/categories/")) return "Категория";
  if (pathname.startsWith("/admin/promo-codes/")) return "Промокод";
  if (pathname.startsWith("/admin/tickets/")) return "Тикет";
  return PAGE_TITLES[pathname] ?? "Админ-панель";
}

export function AdminSidebar({ openTicketCount = 0 }: { openTicketCount?: number }) {
  const pathname = usePathname();

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-brand">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(232,185,35,0.12)] ring-1 ring-[rgba(232,185,35,0.22)]">
          <Sparkles className="h-5 w-5 text-gold" aria-hidden />
        </div>
        <div>
          <p className="font-display text-base font-bold tracking-wide">Eclipse</p>
          <p className="text-[11px] text-[var(--color-text-muted)]">Control Center</p>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-2" aria-label="Админ навигация">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="admin-nav-label">{group.label}</p>
            <div className="mt-2 space-y-1">
              {group.items.map((item) => {
                const { href, label, icon: Icon } = item;
                const exact = "exact" in item ? item.exact : false;
                const active = exact
                  ? pathname === href
                  : pathname === href || pathname.startsWith(`${href}/`);
                const showBadge = href === "/admin/tickets" && openTicketCount > 0;

                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn("admin-nav-item", active && "admin-nav-item-active")}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="min-w-0 flex-1 truncate">{label}</span>
                    {showBadge && (
                      <span className="admin-nav-badge" aria-label={`${openTicketCount} открытых`}>
                        {openTicketCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-[var(--color-border)] p-3">
        <Link href="/" className="admin-nav-item text-[var(--color-text-secondary)]">
          <ExternalLink className="h-4 w-4" aria-hidden />
          Вернуться на сайт
        </Link>
      </div>
    </aside>
  );
}

export function AdminTopBar({
  username,
  email,
  openTicketCount = 0,
}: {
  username: string;
  email: string;
  openTicketCount?: number;
}) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="admin-topbar">
      <div className="min-w-0">
        <p className="admin-breadcrumb">
          <span>Eclipse Admin</span>
          <ChevronRight className="h-3 w-3" aria-hidden />
          <span className="text-gold">{title}</span>
        </p>
      </div>

      <div className="flex items-center gap-3">
        {openTicketCount > 0 && (
          <Link href="/admin/tickets" className="admin-alert-pill">
            <MessageCircle className="h-4 w-4" aria-hidden />
            {openTicketCount} тикет{openTicketCount === 1 ? "" : openTicketCount < 5 ? "а" : "ов"}
          </Link>
        )}
        <div className="admin-user-pill">
          <div className="admin-user-avatar">{username.slice(0, 1).toUpperCase()}</div>
          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-sm font-medium">{username}</p>
            <p className="truncate text-[11px] text-[var(--color-text-muted)]">{email}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

export function MobileAdminNav({ openTicketCount = 0 }: { openTicketCount?: number }) {
  const pathname = usePathname();

  return (
    <nav
      className="admin-mobile-nav"
      aria-label="Мобильная навигация админки"
    >
      {mobileLinks.map(({ href, label, exact }) => {
        const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm transition-colors",
              active
                ? "border-[rgba(232,185,35,0.35)] bg-[rgba(232,185,35,0.1)] text-gold"
                : "border-[var(--color-border)] text-[var(--color-text-secondary)]"
            )}
          >
            {label}
            {href === "/admin/tickets" && openTicketCount > 0 && (
              <span className="admin-nav-badge">{openTicketCount}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
