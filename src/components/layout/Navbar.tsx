import Link from "next/link";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Logo } from "./Logo";
import { UserMenu } from "./UserMenu";
import { CurrencySwitcher } from "./CurrencySwitcher";

export async function Navbar() {
  const session = await getSession();
  let email = "";

  if (session) {
    const [user] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, session.id))
      .limit(1);
    email = user?.email ?? "";
  }

  return (
    <header className="site-header">
      <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="hover:opacity-90 transition-opacity">
          <Logo />
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4" aria-label="Навигация">
          <CurrencySwitcher />
          <Link
            href="/catalog"
            className="hidden sm:inline px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
          >
            Каталог
          </Link>

          {session ? (
            <UserMenu
              username={session.username}
              email={email}
              balance={session.balance}
              isAdmin={session.role === "admin"}
            />
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost text-sm py-2 px-3">
                Вход
              </Link>
              <Link href="/register" className="btn btn-primary text-sm py-2 px-4">
                Регистрация
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
