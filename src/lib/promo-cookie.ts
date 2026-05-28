import { cookies } from "next/headers";

export const ACTIVE_PROMO_COOKIE = "eclipse_active_promo";

export async function getActivePromoCode(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ACTIVE_PROMO_COOKIE)?.value ?? null;
}

export async function setActivePromoCode(code: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_PROMO_COOKIE, code.toUpperCase(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearActivePromoCode(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_PROMO_COOKIE);
}
