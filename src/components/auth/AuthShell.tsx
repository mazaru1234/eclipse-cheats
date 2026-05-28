import Link from "next/link";
import { ReactNode } from "react";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="flex min-h-[calc(100dvh-4.25rem)] w-full">
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center border-r border-[var(--color-border)] bg-[var(--color-bg-elevated)]/40 p-12">
        <div className="max-w-md">
          <div className="eclipse-ring mx-auto mb-10" aria-hidden />
          <h2 className="font-display text-3xl font-bold text-center text-gradient-gold">
            Eclipse Cheats
          </h2>
          <p className="mt-4 text-center text-[var(--color-text-secondary)] leading-relaxed">
            Лицензии, баланс, промокоды и рефералы — всё в одном аккаунте.
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-[420px]">
          <p className="section-label mb-3">Аккаунт</p>
          <h1 className="font-display text-3xl font-bold">{title}</h1>
          <p className="mt-2 text-[var(--color-text-secondary)]">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">{footer}</p>
        </div>
      </div>
    </div>
  );
}

export function AuthLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="text-gold font-medium hover:underline underline-offset-4">
      {children}
    </Link>
  );
}
