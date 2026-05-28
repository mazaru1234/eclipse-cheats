import { nanoid } from "nanoid";
import { eq, and, sql, desc } from "drizzle-orm";
import { db } from "../db";
import {
  users,
  products,
  categories,
  licenseKeys,
  orders,
  promoCodes,
  promoCodeUses,
  referralRewards,
  balanceTransactions,
} from "../db/schema";
import {
  encryptAES256,
  decryptAES256,
  generateProtectionToken,
  hashOrderProtection,
} from "../crypto";
import { getProtectionSecret, safeEqual } from "../security";
import { calculateDiscount } from "../utils";

import { calculateReferrerBonus } from "./referral-settings";

export async function addBalance(
  userId: string,
  amount: number,
  type: "deposit" | "refund" | "referral" | "admin_adjustment",
  description: string,
  orderId?: string
) {
  await db
    .update(users)
    .set({ balance: sql`${users.balance} + ${amount}`, updatedAt: new Date() })
    .where(eq(users.id, userId));

  await db.insert(balanceTransactions).values({
    id: nanoid(),
    userId,
    amount,
    type,
    description,
    orderId,
  });
}

export async function deductBalance(
  userId: string,
  amount: number,
  description: string,
  orderId?: string
) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user || user.balance < amount) {
    throw new Error("Insufficient balance");
  }

  await db
    .update(users)
    .set({ balance: sql`${users.balance} - ${amount}`, updatedAt: new Date() })
    .where(eq(users.id, userId));

  await db.insert(balanceTransactions).values({
    id: nanoid(),
    userId,
    amount: -amount,
    type: "purchase",
    description,
    orderId,
  });
}

export async function importLicenseKeys(productId: string, keys: string[]) {
  const [product] = await db
    .select({
      id: products.id,
      durationDays: products.durationDays,
      lineId: products.lineId,
    })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  if (!product) {
    throw new Error("Тариф не найден. Обновите страницу и выберите тариф заново.");
  }

  if (!product.lineId) {
    throw new Error("Этот тариф привязан к старому формату каталога. Создайте новый тариф у товара.");
  }

  const trimmed = [...new Set(keys.map((k) => k.trim()).filter(Boolean))];
  if (trimmed.length === 0) return 0;

  const batchSize = 50;
  let imported = 0;

  for (let offset = 0; offset < trimmed.length; offset += batchSize) {
    const chunk = trimmed.slice(offset, offset + batchSize);
    const values = chunk.map((key) => ({
      id: nanoid(),
      productId,
      encryptedKey: encryptAES256(key),
      status: "available" as const,
    }));

    await db.insert(licenseKeys).values(values);
    imported += values.length;
  }

  await syncProductStock(productId);
  return imported;
}

export async function syncProductStock(productId: string) {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(licenseKeys)
    .where(
      and(
        eq(licenseKeys.productId, productId),
        eq(licenseKeys.status, "available")
      )
    );

  await db
    .update(products)
    .set({ stockCount: result?.count ?? 0, updatedAt: new Date() })
    .where(eq(products.id, productId));
}

export async function previewPromoCode(code: string) {
  const [promo] = await db
    .select()
    .from(promoCodes)
    .where(and(eq(promoCodes.code, code.toUpperCase()), eq(promoCodes.isActive, true)))
    .limit(1);

  if (!promo) throw new Error("Промокод не найден");
  if (promo.expiresAt && promo.expiresAt < new Date()) {
    throw new Error("Промокод истёк");
  }
  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
    throw new Error("Лимит использований исчерпан");
  }

  return promo;
}

export async function validatePromoCode(code: string, userId: string, orderAmount: number) {
  const [promo] = await db
    .select()
    .from(promoCodes)
    .where(and(eq(promoCodes.code, code.toUpperCase()), eq(promoCodes.isActive, true)))
    .limit(1);

  if (!promo) throw new Error("Invalid promo code");
  if (promo.expiresAt && promo.expiresAt < new Date()) {
    throw new Error("Promo code expired");
  }
  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
    throw new Error("Promo code usage limit reached");
  }
  if (orderAmount < promo.minOrderAmount) {
    throw new Error(`Minimum order amount is $${promo.minOrderAmount}`);
  }

  return promo;
}

export async function createOrder(params: {
  userId: string;
  productId: string;
  promoCode?: string;
}) {
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, params.productId), eq(products.isActive, true)))
    .limit(1);

  if (!product) throw new Error("Product not found");
  if (product.stockCount <= 0) throw new Error("Out of stock");

  let discountAmount = 0;
  let promoCodeId: string | undefined;

  if (params.promoCode) {
    const promo = await validatePromoCode(
      params.promoCode,
      params.userId,
      product.price
    );
    discountAmount = calculateDiscount(
      product.price,
      promo.discountType,
      promo.discountValue
    );
    promoCodeId = promo.id;
  }

  const finalAmount = Math.max(0, product.price - discountAmount);
  const orderId = nanoid();
  const protectionToken = generateProtectionToken();
  const protectionSecret = getProtectionSecret();
  const protectionHash = hashOrderProtection(
    orderId,
    params.userId,
    finalAmount,
    protectionSecret
  );

  await deductBalance(
    params.userId,
    finalAmount,
    `Purchase: ${product.name}`,
    orderId
  );

  const [availableKey] = await db
    .select()
    .from(licenseKeys)
    .where(
      and(
        eq(licenseKeys.productId, params.productId),
        eq(licenseKeys.status, "available")
      )
    )
    .limit(1);

  if (!availableKey) {
    await addBalance(
      params.userId,
      finalAmount,
      "refund",
      `Refund: ${product.name} (no keys)`,
      orderId
    );
    throw new Error("No license keys available");
  }

  await db
    .update(licenseKeys)
    .set({ status: "sold", orderId, soldAt: new Date() })
    .where(eq(licenseKeys.id, availableKey.id));

  await db.insert(orders).values({
    id: orderId,
    userId: params.userId,
    productId: params.productId,
    licenseKeyId: availableKey.id,
    amount: finalAmount,
    originalAmount: product.price,
    discountAmount,
    promoCodeId,
    status: "completed",
    protectionToken,
    protectionHash,
    paymentMethod: "balance",
    completedAt: new Date(),
  });

  if (promoCodeId) {
    await db
      .update(promoCodes)
      .set({ usedCount: sql`${promoCodes.usedCount} + 1` })
      .where(eq(promoCodes.id, promoCodeId));

    await db.insert(promoCodeUses).values({
      id: nanoid(),
      promoCodeId,
      userId: params.userId,
      orderId,
    });
  }

  await syncProductStock(params.productId);
  await processReferralReward(params.userId, orderId, finalAmount);

  const decryptedKey = decryptAES256(availableKey.encryptedKey);

  return {
    orderId,
    protectionToken,
    protectionHash,
    licenseKey: decryptedKey,
    amount: finalAmount,
  };
}

async function processReferralReward(
  buyerId: string,
  orderId: string,
  orderAmount: number
) {
  const [buyer] = await db.select().from(users).where(eq(users.id, buyerId)).limit(1);
  if (!buyer?.referredBy) return;

  const rewardAmount = await calculateReferrerBonus(orderAmount);
  if (rewardAmount <= 0) return;

  await addBalance(
    buyer.referredBy,
    rewardAmount,
    "referral",
    `Referral reward from order ${orderId.slice(0, 8)}`,
    orderId
  );

  await db.insert(referralRewards).values({
    id: nanoid(),
    referrerId: buyer.referredBy,
    referredUserId: buyerId,
    orderId,
    rewardAmount,
  });
}

export function verifyOrderProtection(
  orderId: string,
  userId: string,
  amount: number,
  protectionHash: string
): boolean {
  const protectionSecret = getProtectionSecret();
  const expected = hashOrderProtection(orderId, userId, amount, protectionSecret);
  return safeEqual(expected, protectionHash);
}

export async function getUserOrders(userId: string) {
  return db
    .select({
      order: orders,
      product: products,
      game: categories,
    })
    .from(orders)
    .innerJoin(products, eq(orders.productId, products.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));
}

export async function getDecryptedKeyForOrder(
  orderId: string,
  userId: string,
  protectionToken: string
) {
  const [row] = await db
    .select({ order: orders, key: licenseKeys })
    .from(orders)
    .leftJoin(licenseKeys, eq(orders.licenseKeyId, licenseKeys.id))
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
    .limit(1);

  if (!row?.key) throw new Error("Order or key not found");

  if (!safeEqual(row.order.protectionToken, protectionToken)) {
    throw new Error("Invalid protection token");
  }

  const valid = verifyOrderProtection(
    row.order.id,
    row.order.userId,
    row.order.amount,
    row.order.protectionHash
  );

  if (!valid) {
    await db
      .update(orders)
      .set({ status: "protected" })
      .where(eq(orders.id, orderId));
    throw new Error("Order protection verification failed");
  }

  return decryptAES256(row.key.encryptedKey);
}

export async function getBalanceHistory(userId: string) {
  return db
    .select()
    .from(balanceTransactions)
    .where(eq(balanceTransactions.userId, userId))
    .orderBy(desc(balanceTransactions.createdAt));
}

export async function getReferralStats(userId: string) {
  const referrals = await db
    .select()
    .from(referralRewards)
    .where(eq(referralRewards.referrerId, userId))
    .orderBy(desc(referralRewards.createdAt));

  const totalEarned = referrals.reduce((sum, r) => sum + r.rewardAmount, 0);
  return { referrals, totalEarned };
}
