import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  getAdminTopupContext,
  listAdminDeposits,
  adminManualTopup,
  searchUsersForTopup,
} from "@/lib/services/admin-deposits";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);

    if (searchParams.get("context") === "1") {
      const context = await getAdminTopupContext();
      return NextResponse.json(context);
    }

    if (searchParams.get("users")) {
      const users = await searchUsersForTopup(searchParams.get("users") ?? "", 20);
      return NextResponse.json({ users });
    }

    const result = await listAdminDeposits({
      status: searchParams.get("status") ?? "all",
      search: searchParams.get("search") ?? undefined,
      limit: Number(searchParams.get("limit") ?? 30),
      offset: Number(searchParams.get("offset") ?? 0),
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = (await request.json()) as {
      userId?: string;
      amountRub?: number;
      description?: string;
    };

    if (!body.userId || body.amountRub == null) {
      return NextResponse.json({ error: "userId и amountRub обязательны" }, { status: 400 });
    }

    const result = await adminManualTopup({
      userId: body.userId,
      amountRub: body.amountRub,
      description: body.description,
      adminUsername: admin.username,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ошибка пополнения";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
