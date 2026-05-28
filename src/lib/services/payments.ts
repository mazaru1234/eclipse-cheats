import { nanoid } from "nanoid";
import { eq, desc } from "drizzle-orm";
import { db } from "../db";
import {
  paymentDeposits,
  promoCodeUses,
  promoCodes,
  orders,
  products,
  licenseKeys,
  categories,
} from "../db/schema";
import { addBalance } from "./shop";
import { createPlategaPayment, type PlategaMethodKey, PLATEGA_METHODS } from "../platega";
import { validateUserTopupAmount, calcTopupPayAmount } from "./topup-settings";
import { decryptAES256 } from "../crypto";

export async function createDepositPayment(params: {
  userId: string;
  amountRub: number;
  method: PlategaMethodKey;
  appUrl: string;
}) {
  const settings = await validateUserTopupAmount(params.userId, params.amountRub);
  const { payAmountRub, feePercent } = calcTopupPayAmount(params.amountRub, settings.feePercent);
  const depositId = nanoid();
  const methodConfig = PLATEGA_METHODS[params.method];

  const payload = JSON.stringify({ depositId, userId: params.userId });

  const { transactionId, paymentUrl } = await createPlategaPayment({
    amountRub: payAmountRub,
    description: `Пополнение баланса Eclipse Cheats #${depositId.slice(0, 8)}`,
    returnUrl: `${params.appUrl}/profile/topup?status=success`,
    failedUrl: `${params.appUrl}/profile/topup?status=failed`,
    payload,
    paymentMethod: methodConfig.id,
  });

  await db.insert(paymentDeposits).values({
    id: depositId,
    userId: params.userId,
    plategaTransactionId: transactionId,
    amountUsd: params.amountRub,
    amountRub: params.amountRub,
    feePercent,
    payAmountRub,
    paymentMethod: methodConfig.id ?? undefined,
    status: "pending",
    paymentUrl,
  });

  return { depositId, paymentUrl, payAmountRub, amountRub: params.amountRub };
}

export async function confirmDeposit(
  depositId: string,
  plategaTransactionId: string,
  paidAmount?: number
) {
  const [deposit] = await db
    .select()
    .from(paymentDeposits)
    .where(eq(paymentDeposits.id, depositId))
    .limit(1);

  if (!deposit || deposit.status !== "pending") return false;
  if (deposit.plategaTransactionId !== plategaTransactionId) return false;

  if (paidAmount != null) {
    const expected = Math.round(deposit.payAmountRub * 100) / 100;
    const actual = Math.round(paidAmount * 100) / 100;
    if (Math.abs(actual - expected) > 0.01) {
      console.error(`Deposit amount mismatch for ${depositId}: expected ${expected}, got ${actual}`);
      return false;
    }
  }

  await db
    .update(paymentDeposits)
    .set({ status: "confirmed", confirmedAt: new Date() })
    .where(eq(paymentDeposits.id, depositId));

  await addBalance(
    deposit.userId,
    deposit.amountRub,
    "deposit",
    `Пополнение через Platega (${plategaTransactionId.slice(0, 8)})`
  );

  return true;
}

export async function cancelDeposit(plategaTransactionId: string) {
  await db
    .update(paymentDeposits)
    .set({ status: "canceled" })
    .where(eq(paymentDeposits.plategaTransactionId, plategaTransactionId));
}

export async function getUserDeposits(userId: string) {
  return db
    .select()
    .from(paymentDeposits)
    .where(eq(paymentDeposits.userId, userId))
    .orderBy(desc(paymentDeposits.createdAt));
}

export async function getUserPromoUses(userId: string) {
  return db
    .select({ use: promoCodeUses, promo: promoCodes, order: orders })
    .from(promoCodeUses)
    .innerJoin(promoCodes, eq(promoCodeUses.promoCodeId, promoCodes.id))
    .innerJoin(orders, eq(promoCodeUses.orderId, orders.id))
    .where(eq(promoCodeUses.userId, userId));
}

export async function getUserLicenseKeys(userId: string) {
  const rows = await db
    .select({
      order: orders,
      product: products,
      game: categories,
      key: licenseKeys,
    })
    .from(orders)
    .innerJoin(products, eq(orders.productId, products.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(licenseKeys, eq(orders.licenseKeyId, licenseKeys.id))
    .where(eq(orders.userId, userId));

  return rows
    .filter((r) => r.key && r.order.status === "completed")
    .map((r) => ({
      orderId: r.order.id,
      productName: r.product.name,
      gameName: r.game.name,
      purchasedAt: r.order.createdAt,
      licenseKey: decryptAES256(r.key!.encryptedKey),
    }));
}
