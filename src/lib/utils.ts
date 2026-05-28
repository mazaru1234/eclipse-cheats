import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatRub } from "@/lib/currency";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Цены и баланс хранятся в рублях */
export function formatCurrency(amount: number): string {
  return formatRub(amount);
}
export function slugify(text: string): string {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh", з: "z", и: "i", й: "y",
    к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f",
    х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  };

  return text
    .toLowerCase()
    .trim()
    .split("")
    .map((char) => map[char] ?? char)
    .join("")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function calculateDiscount(
  price: number,
  discountType: "percent" | "fixed",
  discountValue: number
): number {
  if (discountType === "percent") {
    return Math.min(price, (price * discountValue) / 100);
  }
  return Math.min(price, discountValue);
}
