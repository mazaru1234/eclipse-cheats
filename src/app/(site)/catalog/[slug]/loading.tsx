export default function GameCatalogLoading() {
  return (
    <section className="site-container pt-8 pb-24">
      <div className="h-5 w-32 animate-pulse rounded-lg bg-[var(--color-bg-elevated)]" />

      <div className="mt-6 animate-pulse overflow-hidden rounded-2xl border border-[var(--color-border)] p-6 sm:p-10">
        <div className="h-3 w-16 rounded bg-[var(--color-bg-elevated)]" />
        <div className="mt-4 h-10 w-64 max-w-full rounded-xl bg-[var(--color-bg-elevated)]" />
        <div className="mt-4 h-4 w-80 max-w-full rounded bg-[var(--color-bg-elevated)]" />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse overflow-hidden rounded-2xl border border-[var(--color-border)]"
          >
            <div className="h-48 bg-[var(--color-bg-elevated)]" />
            <div className="space-y-3 p-4">
              <div className="h-4 w-3/4 rounded bg-[var(--color-bg-elevated)]" />
              <div className="h-3 w-1/2 rounded bg-[var(--color-bg-elevated)]" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
