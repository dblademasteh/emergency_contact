import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "@/db";
import { admins, users } from "@/db/schema";
import { eq, ilike } from "drizzle-orm";
import { verifyPassword } from "@/lib/passwords";

export const SESSION_COOKIE = "ec_admin_session";

const SESSION_TTL_DAYS = Number(process.env.SESSION_TTL_DAYS ?? 30);
const SESSION_TTL_SECONDS = SESSION_TTL_DAYS * 24 * 60 * 60;

export type SessionRole = "admin" | "user";

export type SessionPayload = {
  role: SessionRole;
  id: string;
  name: string;
  exp: number;
};

function sessionSecret(): string {
  return process.env.SESSION_SECRET ?? "";
}

function sign(value: string): string {
  return createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

function safeEqual(a: Buffer, b: Buffer): boolean {
  const hashedA = createHmac("sha256", a).digest();
  const hashedB = createHmac("sha256", b).digest();
  return timingSafeEqual(hashedA, hashedB);
}

export function createSessionToken(
  role: SessionRole,
  id: string,
  name: string
): string {
  const exp = Date.now() + SESSION_TTL_SECONDS * 1000;
  const payload = Buffer.from(
    JSON.stringify({ role, id, name, exp })
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(
  token: string | undefined | null
): SessionPayload | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  if (!safeEqual(Buffer.from(sig), Buffer.from(sign(payload)))) return null;
  try {
    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as Record<string, unknown>;
    if (typeof data.exp !== "number" || data.exp <= Date.now()) return null;

    // Current format: { role, id, name, exp }
    if (data.role === "admin" || data.role === "user") {
      if (typeof data.id !== "string" || typeof data.name !== "string") {
        return null;
      }
      return {
        role: data.role,
        id: data.id,
        name: data.name,
        exp: data.exp,
      };
    }

    // Legacy admin format: { adminId, username, exp }
    if (typeof data.adminId === "string" && typeof data.username === "string") {
      return {
        role: "admin",
        id: data.adminId,
        name: data.username,
        exp: data.exp,
      };
    }

    return null;
  } catch {
    return null;
  }
}

/** True only for admins (full access: types, settings, logos). */
export function isAdminToken(
  token: string | undefined | null
): boolean {
  return verifySessionToken(token)?.role === "admin";
}

/** True for admins AND users (can manage contacts and groups). */
export function isEditorToken(
  token: string | undefined | null
): boolean {
  const session = verifySessionToken(token);
  return session !== null && (session.role === "admin" || session.role === "user");
}

export async function verifyAdminCredentials(
  username: string,
  password: string
) {
  if (!username || !password) return null;
  const [admin] = await db
    .select()
    .from(admins)
    .where(eq(admins.username, username))
    .limit(1);
  if (!admin) return null;
  if (!verifyPassword(password, admin.passwordHash)) return null;
  return admin;
}

export async function verifyUserCredentials(unitCode: string, password: string) {
  if (!unitCode || !password) return null;
  const [user] = await db
    .select()
    .from(users)
    .where(ilike(users.unitCode, unitCode))
    .limit(1);
  if (!user) return null;
  if (!verifyPassword(password, user.passwordHash)) return null;
  return user;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}