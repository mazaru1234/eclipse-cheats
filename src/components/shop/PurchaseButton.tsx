"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { ShoppingCart, ChevronRight, Tag, ExternalLink } from "lucide-react";
import Link from "next/link";
import { hasExternalUrl } from "@/lib/product-utils";

interface Props {
  productId: string;
  productName: string;
  price: number;
  inStock: boolean;
  externalUrl?: string | null;
  variant?: "default" | "large";
}

export function PurchaseButton({
  productId,
  productName,
  price,
  inStock,
  externalUrl,
  variant = "default",
}: Props) {
  const router = useRouter();
  const { formatPrice } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [purchasedKey, setPurchasedKey] = useState("");
  const [activePromo, setActivePromo] = useState<string | null>(null);
  const isExternal = hasExternalUrl({ externalUrl });

  useEffect(() => {
    fetch("/api/profile/promo")
      .then((res) => (res.ok ? res.json() : { active: null }))
      .then((data) => setActivePromo(data.active?.code ?? null))
      .catch(() => setActivePromo(null));
  }, []);

  function handleExternalBuy() {
    if (!externalUrl) return;
    window.open(externalUrl, "_blank", "noopener,noreferrer");
  }

  async function handlePurchase() {
    setLoading(true);
    setError("");
    setPurchasedKey("");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.error === "Unauthorized") {
          router.push("/login");
          return;
        }
        throw new Error(data.error);
      }

      setPurchasedKey(data.licenseKey);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка покупки");
    } finally {
      setLoading(false);
    }
  }

  function handleClick() {
    if (isExternal) {
      handleExternalBuy();
      return;
    }
    void handlePurchase();
  }

  if (purchasedKey) {
    return (
      <div className="rounded-xl border border-[rgba(34,197,94,0.25)] bg-[rgba(34,197,94,0.08)] p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-success)]">
          Ключ получен
        </p>
        <p className="mt-1 break-all font-mono text-sm text-[var(--color-text)]">{purchasedKey}</p>
      </div>
    );
  }

  const canBuy = isExternal || inStock;
  const promoHint = isExternal ? (
    <p className="text-xs text-[var(--color-text-muted)]">
      Покупка у партнёра — оплата на внешнем сайте или в Telegram.
    </p>
  ) : (
    <p className="text-xs text-[var(--color-text-muted)]">
      {activePromo ? (
        <>
          Активен промокод <span className="font-mono text-gold">{activePromo}</span>
        </>
      ) : (
        <>
          <Tag className="mr-1 inline h-3 w-3" aria-hidden />
          Промокод активируется в{" "}
          <Link href="/profile/promo" className="text-gold hover:underline">
            личном кабинете
          </Link>
        </>
      )}
    </p>
  );

  const buttonLabel = loading
    ? "Обработка..."
    : isExternal
      ? `Купить за ${formatPrice(price)}`
      : inStock
        ? variant === "large"
          ? "Купить сейчас"
          : formatPrice(price)
        : "Нет в наличии";

  if (variant === "large") {
    return (
      <div className="space-y-3">
        {promoHint}
        {error && (
          <p className="text-xs text-[var(--color-danger)]" role="alert">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={handleClick}
          disabled={loading || !canBuy}
          className="btn btn-primary w-full py-4 text-sm font-semibold uppercase tracking-wide"
          aria-label={`Купить ${productName} за ${formatPrice(price)}`}
        >
          {isExternal ? (
            <ExternalLink className="h-4 w-4" aria-hidden />
          ) : (
            <ShoppingCart className="h-4 w-4" aria-hidden />
          )}
          {buttonLabel}
          {!loading && canBuy && <ChevronRight className="h-4 w-4" aria-hidden />}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {promoHint}
      {error && (
        <p className="text-xs text-[var(--color-danger)]" role="alert">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={handleClick}
        disabled={loading || !canBuy}
        className="btn btn-primary w-full py-2.5"
        aria-label={`Купить ${productName} за ${formatPrice(price)}`}
      >
        {isExternal ? (
          <ExternalLink className="h-4 w-4" aria-hidden />
        ) : (
          <ShoppingCart className="h-4 w-4" aria-hidden />
        )}
        {buttonLabel}
      </button>
    </div>
  );
}
