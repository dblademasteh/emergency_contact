import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/passwords";

export const SESSION_COOKIE = "ec_admin_session";

const SESSION_TTL_DAYS = Number(process.env.SESSION_TTL_DAYS ?? 30);
const SESSION_TTL_SECONDS = SESSION_TTL_DAYS * 24 * 60 * 60;

export type SessionPayload = {
  adminId: string;
  username: string;
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

export function createSessionToken(adminId: string, username: string): string {
  const exp = Date.now() + SESSION_TTL_SECONDS * 1000;
  const payload = Buffer.from(
    JSON.stringify({ adminId, username, exp })
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
    ) as { adminId?: unknown; username?: unknown; exp?: unknown };
    if (typeof data.exp !== "number" || data.exp <= Date.now()) return null;
    if (typeof data.adminId !== "string" || typeof data.username !== "string") {
      return null;
    }
    return {
      adminId: data.adminId,
      username: data.username,
      exp: data.exp,
    };
  } catch {
    return null;
  }
}

export async function verifyCredentials(username: string, password: string) {
  if (!username || !password) return null;
  const admin = await prisma.admin.findUnique({ where: { username } });
  if (!admin) return null;
  if (!verifyPassword(password, admin.passwordHash)) return null;
  return admin;
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
