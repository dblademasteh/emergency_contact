import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  createSessionToken,
  sessionCookieOptions,
  verifyAdminCredentials,
  verifyUserCredentials,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const raw =
    body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const identifier =
    typeof raw.identifier === "string"
      ? raw.identifier.trim()
      : typeof raw.username === "string"
        ? raw.username.trim()
        : "";
  const password = typeof raw.password === "string" ? raw.password : "";

  // Admins sign in with their username; users sign in with their unit code.
  const admin = await verifyAdminCredentials(identifier, password);
  if (admin) {
    const cookieStore = await cookies();
    cookieStore.set(
      SESSION_COOKIE,
      createSessionToken("admin", admin.id, admin.username),
      sessionCookieOptions()
    );
    return NextResponse.json({ ok: true, role: "admin" });
  }

  const user = await verifyUserCredentials(identifier, password);
  if (user) {
    const cookieStore = await cookies();
    cookieStore.set(
      SESSION_COOKIE,
      createSessionToken("user", user.id, user.office),
      sessionCookieOptions()
    );
    return NextResponse.json({ ok: true, role: "user" });
  }

  return NextResponse.json(
    { error: "Incorrect username/unit code or password." },
    { status: 401 }
  );
}
