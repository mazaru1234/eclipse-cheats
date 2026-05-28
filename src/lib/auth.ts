import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";

const COOKIE_NAME = "eclipse_session";
const JWT_EXPIRY = "7d";

export interface SessionUser {
  id: string;
  email: string;
  username: string;
  role: "user" | "admin";
  balance: number;
  referralCode: string;
}

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(user: SessionUser): Promise<string> {
  return new SignJWT({
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    balance: user.balance,
    referralCode: user.referralCode,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(getJwtSecret());
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return {
      id: payload.id as string,
      email: payload.email as string,
      username: payload.username as string,
      role: payload.role as "user" | "admin",
      balance: payload.balance as number,
      referralCode: payload.referralCode as string,
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

export async function requireAdmin(): Promise<SessionUser> {
  const session = await requireAuth();
  if (session.role !== "admin") throw new Error("Forbidden");
  return session;
}

export async function refreshSession(userId: string): Promise<SessionUser | null> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return null;

  const sessionUser: SessionUser = {
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

export { COOKIE_NAME };
