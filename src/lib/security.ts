import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { rateLimit } from "./rate-limit";

export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export function getProtectionSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters");
  }
  return secret;
}

export function enforceRateLimit(
  request: Request,
  scope: string,
  limit: number,
  windowMs: number
): NextResponse | null {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";
  const result = rateLimit(`${scope}:${ip}`, limit, windowMs);
  if (result.ok) return null;

  return NextResponse.json(
    { error: "Слишком много запросов. Попробуйте позже." },
    {
      status: 429,
      headers: { "Retry-After": String(result.retryAfter) },
    }
  );
}
