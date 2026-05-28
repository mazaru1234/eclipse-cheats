import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface LegalPageProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function LegalPage({ title, subtitle, children }: LegalPageProps) {
  return (
    <div className="site-container py-10 sm:py-14 max-w-3xl">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-gold transition-colors"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        На главную
      </Link>

      <header className="mt-8 border-b border-[var(--color-border)] pb-8">
        <p className="section-label">Документы</p>
        <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">{title}</h1>
        {subtitle && (
          <p className="mt-4 text-[var(--color-text-secondary)] leading-relaxed">{subtitle}</p>
        )}
      </header>

      <article className="legal-prose mt-10">{children}</article>
    </div>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

export function LegalSection({ title, children }: SectionProps) {
  return (
    <section className="mb-10 last:mb-0">
      <h2 className="font-display text-xl font-semibold text-gold">{title}</h2>
      <div className="mt-4 space-y-3 text-[var(--color-text-secondary)] leading-relaxed">{children}</div>
    </section>
  );
}

export function LegalParagraph({ children }: { children: React.ReactNode }) {
  return <p>{children}</p>;
}

export function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5 marker:text-[var(--color-gold-dim)]">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
