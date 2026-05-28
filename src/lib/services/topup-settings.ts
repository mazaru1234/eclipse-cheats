import { db } from "@/lib/db";
import { topupSettings, paymentDeposits, balanceTransactions } from "@/lib/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";

const DEFAULT_ID = "default";
const DEFAULT_PRESETS = [500, 1000, 2500, 5000, 10000];

export type SafeTopupSettings = {
  enabled: boolean;
  minAmountRub: number;
  maxAmountRub: number;
  feePercent: number;
  presetAmounts: number[];
  userDailyLimitRub: number;
  userDailyMaxCount: number;
  adminManualMaxRub: number;
  adminDailyLimitRub: number;
};

function parsePresets(raw: string): number[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return DEFAULT_PRESETS;
    return parsed.map(Number).filter((n) => Number.isFinite(n) && n > 0);
  } catch {
    return DEFAULT_PRESETS;
  }
}

function toSafe(row: typeof topupSettings.$inferSelect): SafeTopupSettings {
  return {
    enabled: row.enabled,
    minAmountRub: row.minAmountRub,
    maxAmountRub: row.maxAmountRub,
    feePercent: row.feePercent,
    presetAmounts: parsePresets(row.presetAmounts),
    userDailyLimitRub: row.userDailyLimitRub,
    userDailyMaxCount: row.userDailyMaxCount,
    adminManualMaxRub: row.adminManualMaxRub,
    adminDailyLimitRub: row.adminDailyLimitRub,
  };
}

export async function getTopupSettings(): Promise<SafeTopupSettings> {
  const [row] = await db
    .select()
    .from(topupSettings)
    .where(eq(topupSettings.id, DEFAULT_ID))
    .limit(1);

  if (row) return toSafe(row);

  await db.insert(topupSettings).values({ id: DEFAULT_ID });
  const [created] = await db
    .select()
    .from(topupSettings)
    .where(eq(topupSettings.id, DEFAULT_ID))
    .limit(1);

  return toSafe(created);
}

export async function updateTopupSettings(data: Partial<SafeTopupSettings>) {
  await getTopupSettings();

  const patch: Partial<typeof topupSettings.$inferInsert> = { updatedAt: new Date() };
  if (data.enabled !== undefined) patch.enabled = data.enabled;
  if (data.minAmountRub !== undefined) patch.minAmountRub = data.minAmountRub;
  if (data.maxAmountRub !== undefined) patch.maxAmountRub = data.maxAmountRub;
  if (data.feePercent !== undefined) patch.feePercent = data.feePercent;
  if (data.presetAmounts !== undefined) patch.presetAmounts = JSON.stringify(data.presetAmounts);
  if (data.userDailyLimitRub !== undefined) patch.userDailyLimitRub = data.userDailyLimitRub;
  if (data.userDailyMaxCount !== undefined) patch.userDailyMaxCount = data.userDailyMaxCount;
  if (data.adminManualMaxRub !== undefined) patch.adminManualMaxRub = data.adminManualMaxRub;
  if (data.adminDailyLimitRub !== undefined) patch.adminDailyLimitRub = data.adminDailyLimitRub;

  await db.update(topupSettings).set(patch).where(eq(topupSettings.id, DEFAULT_ID));
  return getTopupSettings();
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getUserTopupUsageToday(userId: string) {
  const since = startOfToday();

  const [depositStats] = await db
    .select({
      count: sql<number>`count(*)`,
      total: sql<number>`coalesce(sum(${paymentDeposits.amountRub}), 0)`,
    })
    .from(paymentDeposits)
    .where(and(eq(paymentDeposits.userId, userId), gte(paymentDeposits.createdAt, since)));

  return {
    count: depositStats?.count ?? 0,
    totalRub: depositStats?.total ?? 0,
  };
}

export async function getAdminManualUsageToday() {
  const since = startOfToday();

  const [stats] = await db
    .select({
      total: sql<number>`coalesce(sum(${balanceTransactions.amount}), 0)`,
    })
    .from(balanceTransactions)
    .where(
      and(
        eq(balanceTransactions.type, "admin_adjustment"),
        gte(balanceTransactions.createdAt, since),
        sql`${balanceTransactions.amount} > 0`
      )
    );

  return { totalRub: stats?.total ?? 0 };
}

export async function validateUserTopupAmount(userId: string, amountRub: number) {
  const settings = await getTopupSettings();

  if (!settings.enabled) {
    throw new Error("Пополнение временно отключено");
  }
  if (amountRub < settings.minAmountRub) {
    throw new Error(`Минимальная сумма — ${settings.minAmountRub} ₽`);
  }
  if (amountRub > settings.maxAmountRub) {
    throw new Error(`Максимальная сумма — ${settings.maxAmountRub} ₽`);
  }

  const usage = await getUserTopupUsageToday(userId);
  if (usage.count >= settings.userDailyMaxCount) {
    throw new Error(`Достигнут лимит пополнений в день (${settings.userDailyMaxCount})`);
  }
  if (usage.totalRub + amountRub > settings.userDailyLimitRub) {
    const left = Math.max(0, settings.userDailyLimitRub - usage.totalRub);
    throw new Error(`Превышен дневной лимит. Доступно сегодня: ${Math.round(left)} ₽`);
  }

  return settings;
}

export async function validateAdminManualTopup(amountRub: number) {
  const settings = await getTopupSettings();

  if (amountRub <= 0) {
    throw new Error("Сумма должна быть больше нуля");
  }
  if (amountRub > settings.adminManualMaxRub) {
    throw new Error(`Максимальная сумма за операцию — ${settings.adminManualMaxRub} ₽`);
  }

  const usage = await getAdminManualUsageToday();
  if (usage.totalRub + amountRub > settings.adminDailyLimitRub) {
    const left = Math.max(0, settings.adminDailyLimitRub - usage.totalRub);
    throw new Error(`Превышен дневной лимит админа. Доступно сегодня: ${Math.round(left)} ₽`);
  }

  return settings;
}

export function calcTopupPayAmount(amountRub: number, feePercent: number) {
  const payAmountRub = Math.round(amountRub * (1 + feePercent / 100) * 100) / 100;
  return { amountRub, payAmountRub, feePercent };
}
