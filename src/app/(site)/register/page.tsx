"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell, AuthLink } from "@/components/auth/AuthShell";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref") ?? "";

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState(refCode);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register",
          email,
          username,
          password,
          referralCode: referralCode || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      router.push("/profile");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Регистрация"
      subtitle="Создай аккаунт и получи свою реферальную ссылку"
      footer={
        <>
          Уже есть аккаунт? <AuthLink href="/login">Войти</AuthLink>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="mb-1.5 block text-sm font-medium">
            Никнейм
          </label>
          <input
            id="username"
            required
            minLength={2}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Player"
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@mail.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
            Пароль
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Минимум 8 символов"
          />
        </div>
        <div>
          <label htmlFor="referral" className="mb-1.5 block text-sm font-medium">
            Реферальный код <span className="text-[var(--color-text-muted)]">(необязательно)</span>
          </label>
          <input
            id="referral"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
            placeholder="ABC123"
          />
        </div>
        {error && (
          <p className="text-sm text-[var(--color-danger)]" role="alert">
            {error}
          </p>
        )}
        <button type="submit" disabled={loading} className="btn btn-primary w-full py-3">
          {loading ? "Создаём..." : "Создать аккаунт"}
        </button>
      </form>
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-[var(--color-text-muted)]">Загрузка...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
