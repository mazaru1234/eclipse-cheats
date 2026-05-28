import Link from "next/link";
import {
  HelpCircle,
  Headphones,
  FileText,
  Shield,
  Star,
} from "lucide-react";
import { Logo } from "./Logo";
import { getActiveGames } from "@/lib/catalog";

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[var(--color-text)]">
        <span className="h-4 w-0.5 rounded-full bg-gold" aria-hidden />
        {title}
      </h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function FooterLink({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 py-1.5 text-xs text-[var(--color-text-muted)] transition-colors hover:text-gold"
    >
      {Icon && <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />}
      <span>{children}</span>
    </Link>
  );
}

export async function Footer() {
  const games = await getActiveGames();

  return (
    <footer className="relative z-10 mt-auto border-t border-[var(--color-border)] bg-[var(--color-bg-elevated)]/40">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Logo size="sm" />
            <p className="mt-4 max-w-xs text-xs leading-relaxed text-[var(--color-text-muted)]">
              Премиум читы для популярных игр. Мгновенная выдача ключей и поддержка.
            </p>
          </div>

          <FooterColumn title="Категории">
            <nav className="flex flex-col" aria-label="Категории игр">
              {games.length === 0 ? (
                <span className="text-xs text-[var(--color-text-muted)]">Скоро появятся</span>
              ) : (
                games.slice(0, 6).map((game) => (
                  <FooterLink key={game.id} href={`/catalog/${game.slug}`}>
                    Читы {game.name}
                  </FooterLink>
                ))
              )}
              <FooterLink href="/catalog">Весь каталог</FooterLink>
            </nav>
          </FooterColumn>

          <FooterColumn title="Информация">
            <nav className="flex flex-col" aria-label="Информация">
              <FooterLink href="/catalog" icon={HelpCircle}>
                FAQ
              </FooterLink>
              <FooterLink href="/support" icon={Headphones}>
                Поддержка
              </FooterLink>
              <FooterLink href="/terms" icon={FileText}>
                Пользовательское соглашение
              </FooterLink>
              <FooterLink href="/privacy" icon={Shield}>
                Политика конфиденциальности
              </FooterLink>
              <FooterLink href="/reviews" icon={Star}>
                Отзывы
              </FooterLink>
            </nav>
          </FooterColumn>

          <FooterColumn title="Аккаунт">
            <nav className="flex flex-col" aria-label="Аккаунт">
              <FooterLink href="/login">Вход</FooterLink>
              <FooterLink href="/register">Регистрация</FooterLink>
              <FooterLink href="/profile">Личный кабинет</FooterLink>
            </nav>
          </FooterColumn>
        </div>

        <div className="mt-10 border-t border-[var(--color-border)] pt-6">
          <p className="text-center text-[11px] text-[var(--color-text-muted)]">
            © {new Date().getFullYear()} Eclipse Cheats. Все права защищены.
          </p>
        </div>
      </div>
    </footer>
  );
}
