"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface KeyItem {
  orderId: string;
  productName: string;
  gameName: string;
  purchasedAt: string;
  licenseKey: string;
}

export function KeysList({ keys }: { keys: KeyItem[] }) {
  const [copied, setCopied] = useState<string | null>(null);

  async function copyKey(id: string, key: string) {
    await navigator.clipboard.writeText(key);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  if (keys.length === 0) {
    return <p className="p-5 text-[var(--color-text-secondary)]">Ключей пока нет.</p>;
  }

  return (
    <div className="divide-y divide-[var(--color-border)]">
      {keys.map((item) => (
        <div key={item.orderId} className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-medium">{item.gameName}</p>
              <p className="text-sm text-[var(--color-text-muted)]">{item.productName}</p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                {new Date(item.purchasedAt).toLocaleDateString("ru-RU")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => copyKey(item.orderId, item.licenseKey)}
              className="btn btn-ghost text-xs py-1.5 px-2"
            >
              {copied === item.orderId ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              Копировать
            </button>
          </div>
          <code className="mt-3 block break-all rounded-lg bg-[var(--color-bg-elevated)] p-3 text-sm">
            {item.licenseKey}
          </code>
        </div>
      ))}
    </div>
  );
}
