import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { detectDisplayCurrencyFromLanguage } from "@/lib/currency";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  if (!request.cookies.get("display_currency")) {
    const detected = detectDisplayCurrencyFromLanguage(request.headers.get("accept-language"));
    response.cookies.set("display_currency", detected, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|uploads).*)"],
};
