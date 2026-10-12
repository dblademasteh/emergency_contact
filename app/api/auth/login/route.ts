import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  createSessionToken,
  sessionCookieOptions,
  verifyAdminCredentials,
  verifyUserCredentials,
} from "@/lib/auth";
import { checkRateLimit, authRateLimiter, getClientIdentifier } from "@/lib/rate-limiter";

export async function POST(request: NextRequest) {
  // Rate limiting for authentication attempts
  const rateLimit = checkRateLimit(request, authRateLimiter);
  if (!rateLimit.allowed) {
    const retryAfter = rateLimit.resetTime ? Math.ceil((rateLimit.resetTime - Date.now()) / 1000) : 60;
    return NextResponse.json(
      { success: false, error: "Too many login attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

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
    authRateLimiter.reset(getClientIdentifier(request));
    const cookieStore = await cookies();
    cookieStore.set(
      SESSION_COOKIE,
      createSessionToken("admin", admin.id, admin.username),
      sessionCookieOptions()
    );
    return NextResponse.json({ success: true, data: { role: "admin" } });
  }

  const user = await verifyUserCredentials(identifier, password);
  if (user) {
    authRateLimiter.reset(getClientIdentifier(request));
    const cookieStore = await cookies();
    cookieStore.set(
      SESSION_COOKIE,
      createSessionToken("user", user.id, user.office),
      sessionCookieOptions()
    );
    return NextResponse.json({ success: true, data: { role: "user" } });
  }

  return NextResponse.json(
    { success: false, error: "Incorrect username/unit code or password." },
    { status: 401 }
  );
}

// Also handle CSRF token retrieval with GET request
export async function GET() {
  // This endpoint can be extended to serve CSRF tokens if needed
  return NextResponse.json({ success: true, data: { ok: true } });
}
