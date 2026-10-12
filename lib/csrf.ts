import { randomBytes, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const CSRF_COOKIE = "ec_csrf_token";
const CSRF_HEADER = "x-csrf-token";

/**
 * Generates a new CSRF token.
 * Uses HMAC with the session secret to ensure tokens can't be forged.
 */
function generateCsrfToken(sessionSecret: string): string {
  const random = randomBytes(32).toString("hex");
  const signature = createHmac("sha256", sessionSecret)
    .update(random)
    .digest("hex");
  return `${random}.${signature}`;
}

/**
 * Verifies that a CSRF token was properly signed with the session secret.
 */
function verifyCsrfToken(token: string, sessionSecret: string): boolean {
  if (!token || typeof token !== "string") return false;
  const [random, signature] = token.split(".");
  if (!random || !signature) return false;

  // Re-derive the expected signature exactly as generateCsrfToken does.
  const expectedSignature = createHmac("sha256", sessionSecret)
    .update(random)
    .digest("hex");

  // Constant-time comparison to avoid timing attacks.
  const a = Buffer.from(signature);
  const b = Buffer.from(expectedSignature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Gets or creates a CSRF token for the current session.
 * Should be called in API route handlers.
 */
export async function getCsrfToken(): Promise<string> {
  const cookieStore = await cookies();
  let token = cookieStore.get(CSRF_COOKIE)?.value;

  if (!token) {
    const sessionSecret = process.env.SESSION_SECRET ?? "";
    token = generateCsrfToken(sessionSecret);
    cookieStore.set(CSRF_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
  }

  return token;
}

/**
 * Validates CSRF token from request headers against the cookie value.
 * Use this middleware-style check in POST/PUT/PATCH/DELETE routes.
 */
export function validateCsrfToken(request: NextRequest): boolean {
  const cookieToken = request.cookies.get(CSRF_COOKIE)?.value;
  const headerToken = request.headers.get(CSRF_HEADER);

  if (!cookieToken || !headerToken) return false;
  if (cookieToken !== headerToken) return false;

  const sessionSecret = process.env.SESSION_SECRET ?? "";
  return verifyCsrfToken(headerToken, sessionSecret);
}

/**
 * Middleware for API routes that require CSRF protection.
 * Returns the NextResponse if valid, or an error response if not.
 */
export function withCsrfProtection(request: NextRequest): NextResponse | null {
  if (request.method === "GET" || request.method === "HEAD" || request.method === "OPTIONS") {
    return null; // Safe methods don't need CSRF protection
  }

  if (!validateCsrfToken(request)) {
    return NextResponse.json(
      { error: "Invalid or missing CSRF token." },
      { status: 403 }
    );
  }

  return null;
}