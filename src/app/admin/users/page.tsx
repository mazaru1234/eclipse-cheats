"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Wallet } from "lucide-react";
import { PageHeader, adminInputCls } from "@/components/admin/AdminPrimitives";
import { formatCurrency } from "@/lib/utils";

interface UserRow {
  id: string;
  email: string;
  username: string;
  balance: number;
  role: string;
  referralCode: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");

  async function load() {
    const res = await fetch("/api/admin/balance");
    const data = await res.json();
    setUsers(data.users ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  const visible = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  return (
    <div>
      <PageHeader
        hideTitle
        title="Пользователи"
        subtitle="Аккаунты, балансы и роли"
        actions={
          <Link href="/admin/deposits" className="btn btn-primary inline-flex items-center gap-2 py-2 text-sm">
            <Wallet className="h-4 w-4" />
            Пополнения
          </Link>
        }
      />

      <div className="card mb-6 flex flex-wrap items-center gap-3 p-4 text-sm text-[var(--color-text-secondary)]">
        <Wallet className="h-5 w-5 text-gold" aria-hidden />
        Ручное пополнение и история платежей — в разделе{" "}
        <Link href="/admin/deposits" className="text-gold hover:underline">
          Пополнения
        </Link>
      </div>

      <div className="mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по email или нику…"
          className={`${adminInputCls} max-w-md`}
        />
      </div>

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Никнейм</th>
              <th>Email</th>
              <th>Баланс</th>
              <th>Роль</th>
              <th>Реф. код</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((u) => (
              <tr key={u.id}>
                <td className="font-medium">{u.username}</td>
                <td className="text-[var(--color-text-muted)]">{u.email}</td>
                <td className="font-semibold tabular-nums text-gold">{formatCurrency(u.balance)}</td>
                <td>
                  <span className={`badge ${u.role === "admin" ? "badge-warning" : "badge-success"}`}>
                    {u.role === "admin" ? "Админ" : "Пользователь"}
                  </span>
                </td>
                <td className="font-mono text-xs">{u.referralCode}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {visible.length === 0 && (
          <p className="py-10 text-center text-sm text-[var(--color-text-secondary)]">
            Пользователи не найдены
          </p>
        )}
      </div>
    </div>
  );
}
