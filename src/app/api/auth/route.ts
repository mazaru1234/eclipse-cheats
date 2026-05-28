import { NextResponse } from "next/server";
import { z } from "zod";
import { registerUser, loginUser } from "@/lib/services/users";
import { enforceRateLimit } from "@/lib/security";

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(2).max(32),
  password: z.string().min(8),
  referralCode: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "auth", 15, 60_000);
  if (limited) return limited;

  try {
    const body = await request.json();
    const action = body.action as string;

    if (action === "register") {
      const data = registerSchema.parse(body);
      const user = await registerUser(data);
      return NextResponse.json({ user });
    }

    if (action === "login") {
      const data = loginSchema.parse(body);
      const user = await loginUser(data.email, data.password);
      return NextResponse.json({ user });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Auth failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
