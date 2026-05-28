export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: { ring: 28, text: "text-base" },
    md: { ring: 34, text: "text-lg" },
    lg: { ring: 44, text: "text-2xl" },
  };
  const s = sizes[size];

  return (
    <span className="inline-flex items-center gap-2.5">
      <svg
        width={s.ring}
        height={s.ring}
        viewBox="0 0 40 40"
        fill="none"
        aria-hidden
        className="shrink-0"
      >
        <circle cx="20" cy="20" r="18" stroke="rgba(232,185,35,0.25)" strokeWidth="1" />
        <circle cx="20" cy="20" r="11" fill="#030304" stroke="rgba(232,185,35,0.5)" strokeWidth="1.5" />
        <path
          d="M8 22a14 14 0 0 1 24-4"
          stroke="url(#eclipseGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="eclipseGrad" x1="8" y1="18" x2="32" y2="18">
            <stop stopColor="#e8b923" />
            <stop offset="1" stopColor="#fff5cc" />
          </linearGradient>
        </defs>
      </svg>
      <span className={`font-display font-bold tracking-tight ${s.text}`}>
        <span className="text-gradient-gold">Eclipse</span>
        <span className="text-[var(--color-text-secondary)] font-medium ml-1">Cheats</span>
      </span>
    </span>
  );
}
