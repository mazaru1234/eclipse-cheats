import { sqliteTable, text, integer, real, uniqueIndex } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["user", "admin"] }).notNull().default("user"),
  balance: real("balance").notNull().default(0),
  referralCode: text("referral_code").notNull().unique(),
  referredBy: text("referred_by"),
  avatarUrl: text("avatar_url"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  imageUrl: text("image_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const productLines = sqliteTable(
  "product_lines",
  {
    id: text("id").primaryKey(),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    longDescription: text("long_description"),
    imageUrl: text("image_url"),
    galleryUrls: text("gallery_urls"),
    features: text("features"),
    systemRequirements: text("system_requirements"),
    safetyRating: integer("safety_rating").notNull().default(5),
    functionalityRating: integer("functionality_rating").notNull().default(5),
    status: text("status", {
      enum: ["undetected", "on_update", "use_on_risk", "detected"],
    })
      .notNull()
      .default("on_update"),
    needsUsb: integer("needs_usb", { mode: "boolean" }).notNull().default(false),
    hasSpoofer: integer("has_spoofer", { mode: "boolean" }).notNull().default(false),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [uniqueIndex("product_line_category_slug").on(table.categoryId, table.slug)]
);

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  lineId: text("line_id").references(() => productLines.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  price: real("price").notNull(),
  imageUrl: text("image_url"),
  externalUrl: text("external_url"),
  durationDays: integer("duration_days").notNull().default(30),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  stockCount: integer("stock_count").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const licenseKeys = sqliteTable("license_keys", {
  id: text("id").primaryKey(),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  encryptedKey: text("encrypted_key").notNull(),
  status: text("status", { enum: ["available", "reserved", "sold"] })
    .notNull()
    .default("available"),
  orderId: text("order_id"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  soldAt: integer("sold_at", { mode: "timestamp" }),
});

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  productId: text("product_id")
    .notNull()
    .references(() => products.id),
  licenseKeyId: text("license_key_id").references(() => licenseKeys.id),
  amount: real("amount").notNull(),
  originalAmount: real("original_amount").notNull(),
  discountAmount: real("discount_amount").notNull().default(0),
  promoCodeId: text("promo_code_id"),
  status: text("status", {
    enum: ["pending", "paid", "completed", "cancelled", "protected"],
  })
    .notNull()
    .default("pending"),
  protectionToken: text("protection_token").notNull(),
  protectionHash: text("protection_hash").notNull(),
  paymentMethod: text("payment_method", { enum: ["balance", "external"] })
    .notNull()
    .default("balance"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  completedAt: integer("completed_at", { mode: "timestamp" }),
});

export const promoCodes = sqliteTable("promo_codes", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  discountType: text("discount_type", { enum: ["percent", "fixed"] }).notNull(),
  discountValue: real("discount_value").notNull(),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").notNull().default(0),
  minOrderAmount: real("min_order_amount").notNull().default(0),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const promoCodeUses = sqliteTable("promo_code_uses", {
  id: text("id").primaryKey(),
  promoCodeId: text("promo_code_id")
    .notNull()
    .references(() => promoCodes.id),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const referralRewards = sqliteTable("referral_rewards", {
  id: text("id").primaryKey(),
  referrerId: text("referrer_id")
    .notNull()
    .references(() => users.id),
  referredUserId: text("referred_user_id")
    .notNull()
    .references(() => users.id),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id),
  rewardAmount: real("reward_amount").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const balanceTransactions = sqliteTable("balance_transactions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  amount: real("amount").notNull(),
  type: text("type", {
    enum: ["deposit", "purchase", "refund", "referral", "admin_adjustment"],
  }).notNull(),
  description: text("description").notNull(),
  orderId: text("order_id"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const referralSettings = sqliteTable("referral_settings", {
  id: text("id").primaryKey(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  friendDiscountType: text("friend_discount_type", { enum: ["fixed", "percent"] })
    .notNull()
    .default("fixed"),
  friendDiscountRub: real("friend_discount_rub").notNull().default(50),
  friendDiscountUsd: real("friend_discount_usd").notNull().default(0.5),
  referrerBonusType: text("referrer_bonus_type", { enum: ["fixed", "percent"] })
    .notNull()
    .default("percent"),
  referrerBonusRub: real("referrer_bonus_rub").notNull().default(0),
  referrerBonusUsd: real("referrer_bonus_usd").notNull().default(5),
  dynamicRankBonus: integer("dynamic_rank_bonus", { mode: "boolean" }).notNull().default(false),
  recurrentBonus: integer("recurrent_bonus", { mode: "boolean" }).notNull().default(false),
  monthlyReferralLimit: integer("monthly_referral_limit").notNull().default(20),
  bonusValidityDays: integer("bonus_validity_days").notNull().default(90),
  payoutDelayDays: integer("payout_delay_days").notNull().default(0),
  maxReferralsPerIP: integer("max_referrals_per_ip").notNull().default(3),
  blockedEmailDomains: text("blocked_email_domains").notNull().default(""),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const exchangeRates = sqliteTable("exchange_rates", {
  id: text("id").primaryKey(),
  eurRub: real("eur_rub").notNull(),
  usdRub: real("usd_rub").notNull(),
  source: text("source").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const topupSettings = sqliteTable("topup_settings", {
  id: text("id").primaryKey(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  minAmountRub: real("min_amount_rub").notNull().default(100),
  maxAmountRub: real("max_amount_rub").notNull().default(100000),
  feePercent: real("fee_percent").notNull().default(5),
  presetAmounts: text("preset_amounts").notNull().default("[500,1000,2500,5000,10000]"),
  userDailyLimitRub: real("user_daily_limit_rub").notNull().default(50000),
  userDailyMaxCount: integer("user_daily_max_count").notNull().default(10),
  adminManualMaxRub: real("admin_manual_max_rub").notNull().default(50000),
  adminDailyLimitRub: real("admin_daily_limit_rub").notNull().default(500000),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const paymentDeposits = sqliteTable("payment_deposits", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  plategaTransactionId: text("platega_transaction_id"),
  amountUsd: real("amount_usd").notNull(),
  amountRub: real("amount_rub").notNull(),
  feePercent: real("fee_percent").notNull().default(5),
  payAmountRub: real("pay_amount_rub").notNull(),
  paymentMethod: integer("payment_method"),
  status: text("status", { enum: ["pending", "confirmed", "canceled"] })
    .notNull()
    .default("pending"),
  paymentUrl: text("payment_url"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  confirmedAt: integer("confirmed_at", { mode: "timestamp" }),
});

export const supportTickets = sqliteTable("support_tickets", {
  id: text("id").primaryKey(),
  ticketNumber: text("ticket_number").notNull().unique(),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status", { enum: ["open", "in_progress", "resolved", "closed"] })
    .notNull()
    .default("open"),
  priority: text("priority", { enum: ["low", "normal", "high", "urgent"] })
    .notNull()
    .default("normal"),
  lastReplyAt: integer("last_reply_at", { mode: "timestamp" }),
  lastReplyBy: text("last_reply_by", { enum: ["user", "admin", "system"] }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const ticketMessages = sqliteTable("ticket_messages", {
  id: text("id").primaryKey(),
  ticketId: text("ticket_id")
    .notNull()
    .references(() => supportTickets.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["user", "admin", "system"] }).notNull(),
  authorName: text("author_name").notNull(),
  body: text("body").notNull(),
  attachments: text("attachments"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const reviews = sqliteTable(
  "reviews",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    productLineId: text("product_line_id")
      .notNull()
      .references(() => productLines.id, { onDelete: "cascade" }),
    orderId: text("order_id").references(() => orders.id),
    rating: integer("rating").notNull(),
    body: text("body").notNull(),
    status: text("status", { enum: ["pending", "approved", "rejected"] })
      .notNull()
      .default("pending"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [uniqueIndex("review_user_line").on(table.userId, table.productLineId)]
);

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  balanceTransactions: many(balanceTransactions),
  supportTickets: many(supportTickets),
  reviews: many(reviews),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
  productLines: many(productLines),
}));

export const productLinesRelations = relations(productLines, ({ one, many }) => ({
  category: one(categories, {
    fields: [productLines.categoryId],
    references: [categories.id],
  }),
  tiers: many(products),
  reviews: many(reviews),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, { fields: [reviews.userId], references: [users.id] }),
  productLine: one(productLines, {
    fields: [reviews.productLineId],
    references: [productLines.id],
  }),
  order: one(orders, { fields: [reviews.orderId], references: [orders.id] }),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  line: one(productLines, {
    fields: [products.lineId],
    references: [productLines.id],
  }),
  keys: many(licenseKeys),
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  product: one(products, {
    fields: [orders.productId],
    references: [products.id],
  }),
  licenseKey: one(licenseKeys, {
    fields: [orders.licenseKeyId],
    references: [licenseKeys.id],
  }),
}));

export const supportTicketsRelations = relations(supportTickets, ({ one, many }) => ({
  user: one(users, { fields: [supportTickets.userId], references: [users.id] }),
  messages: many(ticketMessages),
}));

export const ticketMessagesRelations = relations(ticketMessages, ({ one }) => ({
  ticket: one(supportTickets, {
    fields: [ticketMessages.ticketId],
    references: [supportTickets.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type ProductLine = typeof productLines.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type PromoCode = typeof promoCodes.$inferSelect;
export type ReferralSettings = typeof referralSettings.$inferSelect;
export type TopupSettings = typeof topupSettings.$inferSelect;
export type BalanceTransaction = typeof balanceTransactions.$inferSelect;
export type SupportTicket = typeof supportTickets.$inferSelect;
export type TicketMessage = typeof ticketMessages.$inferSelect;
export type Review = typeof reviews.$inferSelect;
