"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function ReviewStars({
  value,
  onChange,
  readonly = false,
  size = "md",
}: {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: "sm" | "md";
}) {
  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  if (readonly) {
    return (
      <div
        className="flex items-center gap-0.5"
        role="img"
        aria-label={`Оценка ${value} из 5`}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              iconSize,
              star <= value ? "fill-current text-gold" : "text-[var(--color-text-muted)]"
            )}
            aria-hidden
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          className={cn(
            "cursor-pointer transition-colors hover:scale-110",
            star <= value ? "text-gold" : "text-[var(--color-text-muted)]"
          )}
          aria-label={`${star} звёзд`}
        >
          <Star className={cn(iconSize, star <= value && "fill-current")} />
        </button>
      ))}
    </div>
  );
}
