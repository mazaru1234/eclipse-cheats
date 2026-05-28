const TELEGRAM_URL = "https://t.me/EclipseHacksss";

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.93 6.24-1.64 7.72c-.12.55-.44.69-.89.43l-2.46-1.81-1.19 1.15c-.13.13-.24.24-.49.24l.18-2.55 4.57-4.13c.2-.18-.04-.28-.31-.1l-5.65 3.56-2.43-.76c-.53-.16-.54-.53.11-.79l9.52-3.67c.44-.16.83.1.69.71z" />
    </svg>
  );
}

export function TelegramFloat() {
  return (
    <a
      href={TELEGRAM_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="telegram-float"
      aria-label="Написать в Telegram"
      title="Telegram — @EclipseHacksss"
    >
      <TelegramIcon className="h-5 w-5" />
    </a>
  );
}

export { TELEGRAM_URL };
