import { nanoid } from "nanoid";
import { eq, or } from "drizzle-orm";
import { db } from "../db";
import { users, categories, products, productLines, promoCodes } from "../db/schema";
import { ensureProductLinesMigrated } from "../catalog";
import { hashPassword, createSession, setSessionCookie } from "../auth";
import { generateReferralCode } from "../crypto";
import { slugify } from "../utils";

export async function registerUser(data: {
  email: string;
  username: string;
  password: string;
  referralCode?: string;
}) {
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, data.email.toLowerCase()))
    .limit(1);

  if (existing.length > 0) {
    throw new Error("Email already registered");
  }

  let referredBy: string | undefined;
  if (data.referralCode) {
    const [referrer] = await db
      .select()
      .from(users)
      .where(eq(users.referralCode, data.referralCode.toUpperCase()))
      .limit(1);
    if (referrer) referredBy = referrer.id;
  }

  const userId = nanoid();
  const passwordHash = await hashPassword(data.password);
  const referralCode = generateReferralCode();

  await db.insert(users).values({
    id: userId,
    email: data.email.toLowerCase(),
    username: data.username,
    passwordHash,
    referralCode,
    referredBy,
    role: "user",
    balance: 0,
  });

  const sessionUser = {
    id: userId,
    email: data.email.toLowerCase(),
    username: data.username,
    role: "user" as const,
    balance: 0,
    referralCode,
  };

  const token = await createSession(sessionUser);
  await setSessionCookie(token);
  return sessionUser;
}

export async function loginUser(email: string, password: string) {
  const { verifyPassword, createSession, setSessionCookie } = await import("../auth");

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (!user) throw new Error("Invalid credentials");

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) throw new Error("Invalid credentials");

  const sessionUser = {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    balance: user.balance,
    referralCode: user.referralCode,
  };

  const token = await createSession(sessionUser);
  await setSessionCookie(token);
  return sessionUser;
}

export async function seedAdminIfNeeded() {
  const email = process.env.ADMIN_EMAIL ?? "admin@eclipse-cheats.local";
  const password = process.env.ADMIN_PASSWORD ?? "ChangeMe123!";

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) return;

  await db.insert(users).values({
    id: nanoid(),
    email,
    username: "Admin",
    passwordHash: await hashPassword(password),
    role: "admin",
    balance: 0,
    referralCode: generateReferralCode(),
  });
}

const DEMO_GAMES = [
  {
    name: "Rust",
    slug: "rust",
    description: "External и internal читы для Rust. Silent Aim, ESP, Movement.",
    sortOrder: 1,
    lines: [
      {
        name: "Renthal External",
        slug: "renthal-external",
        description: "Мощный внешний чит для Rust с Silent Aim, Visuals и Movement.",
        longDescription:
          "Мощный внешний чит для Rust с функциями Silent Aim, Visuals и Movement. Лучший софт для доминирования на серверах.",
        features: [
          { name: "AIM", items: ["Silent Aim", "Smooth aim", "FOV slider"] },
          { name: "Визуалы", items: ["Player ESP", "Loot ESP", "Radar"] },
          { name: "Разное", items: ["Movement hacks", "Stream proof"] },
        ],
        systemRequirements: ["Windows 10/11 x64", "8 GB RAM", "DirectX 11", "Актуальная версия Rust"],
        tiers: [
          { durationDays: 1, price: 399 },
          { durationDays: 3, price: 799 },
          { durationDays: 7, price: 1599 },
          { durationDays: 30, price: 2999 },
        ],
      },
      {
        name: "Morphine External",
        slug: "morphine-external",
        description: "Стабильный external с акцентом на legit-игру.",
        tiers: [
          { durationDays: 1, price: 399 },
          { durationDays: 7, price: 1499 },
          { durationDays: 30, price: 2999 },
        ],
      },
      {
        name: "Stealth Full",
        slug: "stealth-full",
        description: "Full-featured пакет с расширенным функционалом.",
        tiers: [
          { durationDays: 7, price: 1999 },
          { durationDays: 30, price: 3999 },
        ],
      },
    ],
  },
  {
    name: "Apex Legends",
    slug: "apex-legends",
    description: "Aimbot, ESP, radar. Обновления под актуальный патч.",
    sortOrder: 2,
    lines: [
      {
        name: "Eclipse Pro",
        slug: "eclipse-pro",
        description: "Полный пакет для Apex Legends с aimbot и ESP.",
        tiers: [
          { durationDays: 7, price: 1299 },
          { durationDays: 30, price: 2999 },
          { durationDays: 90, price: 6999 },
        ],
      },
    ],
  },
  {
    name: "Valorant",
    slug: "valorant",
    description: "Wallhack, triggerbot. Undetected на момент выдачи.",
    sortOrder: 3,
    lines: [
      {
        name: "Eclipse Valorant",
        slug: "eclipse-valorant",
        description: "Legit и rage конфиги для Valorant.",
        tiers: [
          { durationDays: 7, price: 1499 },
          { durationDays: 30, price: 3999 },
        ],
      },
    ],
  },
  {
    name: "CS2",
    slug: "cs2",
    description: "Legit и rage конфиги, skin changer.",
    sortOrder: 4,
    lines: [
      {
        name: "Eclipse CS2",
        slug: "eclipse-cs2",
        description: "Месячная лицензия с полным функционалом.",
        tiers: [{ durationDays: 30, price: 2499 }],
      },
    ],
  },
];

async function insertGameCatalog() {
  for (const game of DEMO_GAMES) {
    const gameId = nanoid();
    await db.insert(categories).values({
      id: gameId,
      name: game.name,
      slug: game.slug,
      description: game.description,
      sortOrder: game.sortOrder,
      isActive: true,
    });

    let lineOrder = 0;
    for (const line of game.lines) {
      const lineId = nanoid();
      await db.insert(productLines).values({
        id: lineId,
        categoryId: gameId,
        name: line.name,
        slug: line.slug,
        description: line.description,
        longDescription: line.longDescription ?? line.description,
        features: line.features ? JSON.stringify(line.features) : null,
        systemRequirements: line.systemRequirements ? JSON.stringify(line.systemRequirements) : null,
        sortOrder: lineOrder++,
        isActive: true,
      });

      await db.insert(products).values(
        line.tiers.map((tier) => ({
          id: nanoid(),
          categoryId: gameId,
          lineId,
          name: `${tier.durationDays} дней`,
          slug: `${game.slug}-${line.slug}-${tier.durationDays}d`,
          description: line.description,
          price: tier.price,
          durationDays: tier.durationDays,
          isActive: true,
          stockCount: 0,
        }))
      );
    }
  }

  await db.insert(promoCodes).values({
    id: nanoid(),
    code: "ECLIPSE10",
    discountType: "percent",
    discountValue: 10,
    maxUses: 100,
    minOrderAmount: 10,
    isActive: true,
  });
}

/** Старый каталог: категория FPS + игры как товары → переносим в игры + подписки */
export async function migrateLegacyCatalog() {
  const [legacyCat] = await db
    .select()
    .from(categories)
    .where(
      or(
        eq(categories.slug, "fps"),
        eq(categories.slug, "fps-cheats"),
        eq(categories.name, "FPS"),
        eq(categories.name, "FPS Cheats")
      )
    )
    .limit(1);

  if (!legacyCat) return;

  const legacyProducts = await db
    .select()
    .from(products)
    .where(eq(products.categoryId, legacyCat.id));

  if (legacyProducts.length === 0) {
    await db.delete(categories).where(eq(categories.id, legacyCat.id));
    return;
  }

  let sortOrder = 1;
  for (const old of legacyProducts) {
    const gameId = nanoid();
    const gameSlug = old.slug;

    await db.insert(categories).values({
      id: gameId,
      name: old.name,
      slug: gameSlug,
      description: old.description,
      sortOrder: sortOrder++,
      isActive: old.isActive,
    });

    await db
      .update(products)
      .set({
        categoryId: gameId,
        name: `${old.durationDays} дней`,
        slug: `${gameSlug}-${old.durationDays}d`,
        description: "Подписка",
        updatedAt: new Date(),
      })
      .where(eq(products.id, old.id));
  }

  await db.delete(categories).where(eq(categories.id, legacyCat.id));
}

export async function seedDemoData() {
  await migrateLegacyCatalog();

  const [existingCat] = await db.select().from(categories).limit(1);
  if (!existingCat) {
    await insertGameCatalog();
  }

  await ensureProductLinesMigrated();
}

export { slugify };
