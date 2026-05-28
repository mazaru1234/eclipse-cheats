"use client";

import { useEffect, useState } from "react";
import { Copy, Check } from "lucide-react";

interface Props {
  referralCode: string;
  username: string;
  email: string;
}

export function ProfileClient({ referralCode, username, email }: Props) {
  const [copied, setCopied] = useState(false);
  const [referralLink, setReferralLink] = useState(`/register?ref=${referralCode}`);

  useEffect(() => {
    setReferralLink(`${window.location.origin}/register?ref=${referralCode}`);
  }, [referralCode]);

  async function copyReferral() {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="mt-10 grid gap-4 lg:grid-cols-2">
      <div className="card p-5">
        <h2 className="font-display text-lg font-semibold">Данные аккаунта</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4 border-b border-[var(--color-border)] pb-3">
            <dt className="text-[var(--color-text-muted)]">Никнейм</dt>
            <dd className="font-medium">{username}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-[var(--color-border)] pb-3">
            <dt className="text-[var(--color-text-muted)]">Email</dt>
            <dd className="font-medium">{email}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--color-text-muted)]">Реф. код</dt>
            <dd className="font-mono text-gold">{referralCode}</dd>
          </div>
        </dl>
      </div>

      <div className="card p-5">
        <h2 className="font-display text-lg font-semibold">Реферальная программа</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
          Делись ссылкой — получай 5% с каждой покупки приглашённого пользователя.
        </p>
        <div className="mt-4 flex min-w-0 gap-2">
          <input readOnly value={referralLink} className="min-w-0 flex-1 font-mono text-xs" aria-label="Реферальная ссылка" />
          <button
            type="button"
            onClick={copyReferral}
            className="btn btn-ghost shrink-0 px-3"
            aria-label="Скопировать ссылку"
          >
            {copied ? <Check className="h-4 w-4 text-[var(--color-success)]" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </section>
  );
}
