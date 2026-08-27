import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/passwords";
import {
  SESSION_COOKIE,
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const raw =
    body && typeof body === "object" ? (body as Record<string, unknown>) : {};

  const office = typeof raw.office === "string" ? raw.office.trim() : "";
  const unitCode =
    typeof raw.unitCode === "string" ? raw.unitCode.trim().toUpperCase() : "";
  const password = typeof raw.password === "string" ? raw.password : "";

  if (!office) {
    return NextResponse.json({ error: "Office is required." }, { status: 400 });
  }
  if (office.length > 100) {
    return NextResponse.json(
      { error: "Office is too long (max 100 characters)." },
      { status: 400 }
    );
  }
  if (!unitCode) {
    return NextResponse.json(
      { error: "Unit code is required." },
      { status: 400 }
    );
  }
  if (unitCode.length > 50) {
    return NextResponse.json(
      { error: "Unit code is too long (max 50 characters)." },
      { status: 400 }
    );
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters." },
      { status: 400 }
    );
  }

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.unitCode, unitCode))
    .limit(1);
  if (existing) {
    return NextResponse.json(
      { error: "That unit code is already registered." },
      { status: 409 }
    );
  }

  const [user] = await db
    .insert(users)
    .values({ office, unitCode, passwordHash: hashPassword(password) })
    .returning();

  // Auto sign-in after creating the account.
  const cookieStore = await cookies();
  cookieStore.set(
    SESSION_COOKIE,
    createSessionToken("user", user.id, user.office),
    sessionCookieOptions()
  );

  return NextResponse.json({ ok: true, role: "user" }, { status: 201 });
}