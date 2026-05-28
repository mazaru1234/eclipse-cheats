import { db } from "@/lib/db";
import { paymentDeposits, users, balanceTransactions } from "@/lib/db/schema";
import { eq, and, desc, sql, or, like } from "drizzle-orm";
import { addBalance } from "./shop";
import { validateAdminManualTopup, getAdminManualUsageToday, getTopupSettings } from "./topup-settings";

export interface AdminDepositRow {
  id: string;
  type: "platega" | "manual";
  userId: string;
  username: string;
  email: string;
  amountRub: number;
  payAmountRub: number | null;
  feePercent: number | null;
  status: string;
  description: string | null;
  createdAt: Date;
  confirmedAt: Date | null;
}

export interface DepositStats {
  pending: number;
  confirmedToday: number;
  volumeTodayRub: number;
  manualTodayRub: number;
  totalConfirmed: number;
  totalVolumeRub: number;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getDepositStats(): Promise<DepositStats> {
  const since = startOfToday();
  const all = await db.select({ status: paymentDeposits.status, amountRub: paymentDeposits.amountRub, createdAt: paymentDeposits.createdAt, confirmedAt: paymentDeposits.confirmedAt }).from(paymentDeposits);

  const manualUsage = await getAdminManualUsageToday();

  const pending = all.filter((d) => d.status === "pending").length;
  const confirmedToday = all.filter(
    (d) => d.status === "confirmed" && (d.confirmedAt ?? d.createdAt) >= since
  ).length;
  const volumeTodayRub = all
    .filter((d) => d.status === "confirmed" && (d.confirmedAt ?? d.createdAt) >= since)
    .reduce((sum, d) => sum + d.amountRub, 0);
  const totalConfirmed = all.filter((d) => d.status === "confirmed").length;
  const totalVolumeRub = all
    .filter((d) => d.status === "confirmed")
    .reduce((sum, d) => sum + d.amountRub, 0);

  return {
    pending,
    confirmedToday,
    volumeTodayRub,
    manualTodayRub: manualUsage.totalRub,
    totalConfirmed,
    totalVolumeRub,
  };
}

export async function listAdminDeposits(params: {
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const limit = params.limit ?? 30;
  const offset = params.offset ?? 0;
  const conditions = [];

  if (params.status && params.status !== "all") {
    conditions.push(eq(paymentDeposits.status, params.status as "pending" | "confirmed" | "canceled"));
  }

  if (params.search?.trim()) {
    const q = `%${params.search.trim()}%`;
    conditions.push(or(like(users.username, q), like(users.email, q), like(paymentDeposits.id, q)));
  }

  const plategaRows = await db
    .select({
      deposit: paymentDeposits,
      user: users,
    })
    .from(paymentDeposits)
    .innerJoin(users, eq(paymentDeposits.userId, users.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(paymentDeposits.createdAt))
    .limit(limit)
    .offset(offset);

  const manualRows = await db
    .select({
      tx: balanceTransactions,
      user: users,
    })
    .from(balanceTransactions)
    .innerJoin(users, eq(balanceTransactions.userId, users.id))
    .where(
      and(
        eq(balanceTransactions.type, "admin_adjustment"),
        sql`${balanceTransactions.amount} > 0`,
        params.search?.trim()
          ? or(
              like(users.username, `%${params.search.trim()}%`),
              like(users.email, `%${params.search.trim()}%`)
            )
          : undefined
      )
    )
    .orderBy(desc(balanceTransactions.createdAt))
    .limit(20);

  const platega: AdminDepositRow[] = plategaRows.map(({ deposit, user }) => ({
    id: deposit.id,
    type: "platega",
    userId: user.id,
    username: user.username,
    email: user.email,
    amountRub: deposit.amountRub,
    payAmountRub: deposit.payAmountRub,
    feePercent: deposit.feePercent,
    status: deposit.status,
    description: null,
    createdAt: deposit.createdAt,
    confirmedAt: deposit.confirmedAt,
  }));

  const manual: AdminDepositRow[] = manualRows.map(({ tx, user }) => ({
    id: tx.id,
    type: "manual",
    userId: user.id,
    username: user.username,
    email: user.email,
    amountRub: tx.amount,
    payAmountRub: null,
    feePercent: null,
    status: "confirmed",
    description: tx.description,
    createdAt: tx.createdAt,
    confirmedAt: tx.createdAt,
  }));

  const merged = [...platega, ...manual]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);

  const [countRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(paymentDeposits)
    .where(conditions.length ? and(...conditions) : undefined);

  return { rows: merged, total: countRow?.count ?? merged.length };
}

export async function adminManualTopup(params: {
  userId: string;
  amountRub: number;
  description?: string;
  adminUsername: string;
}) {
  await validateAdminManualTopup(params.amountRub);

  const [user] = await db.select().from(users).where(eq(users.id, params.userId)).limit(1);
  if (!user) throw new Error("Пользователь не найден");

  const note =
    params.description?.trim() ||
    `Ручное пополнение админом (${params.adminUsername})`;

  await addBalance(params.userId, params.amountRub, "admin_adjustment", note);

  return { userId: params.userId, amountRub: params.amountRub, newBalance: user.balance + params.amountRub };
}

export async function searchUsersForTopup(query: string, limit = 20) {
  const q = query.trim();
  if (!q) {
    return db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        balance: users.balance,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(limit);
  }

  const pattern = `%${q}%`;
  return db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      balance: users.balance,
    })
    .from(users)
    .where(or(like(users.username, pattern), like(users.email, pattern)))
    .limit(limit);
}

export async function getAdminTopupContext() {
  const [settings, stats, adminUsage] = await Promise.all([
    getTopupSettings(),
    getDepositStats(),
    getAdminManualUsageToday(),
  ]);

  return {
    settings,
    stats,
    adminUsageTodayRub: adminUsage.totalRub,
    adminRemainingTodayRub: Math.max(0, settings.adminDailyLimitRub - adminUsage.totalRub),
  };
}
