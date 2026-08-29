import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SESSION_COOKIE, isAdminToken } from "@/lib/auth";

const APP_NAME_KEY = "appName";
const MAX_NAME_LENGTH = 60;

export async function GET() {
  const [setting] = await db
    .select()
    .from(settings)
    .where(eq(settings.key, APP_NAME_KEY))
    .limit(1);
  return NextResponse.json({ name: setting?.value ?? null });
}

export async function POST(request: NextRequest) {
  if (!isAdminToken(request.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json(
      { error: "Unauthorized. Admin access required." },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => null);
  const name =
    body && typeof body === "object"
      ? (body as { name?: unknown }).name
      : undefined;

  if (name === null || name === "") {
    await db.delete(settings).where(eq(settings.key, APP_NAME_KEY));
    return NextResponse.json({ name: null });
  }

  if (typeof name !== "string") {
    return NextResponse.json({ error: "Invalid app name." }, { status: 400 });
  }
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return NextResponse.json({ error: "App name cannot be empty." }, { status: 400 });
  }
  if (trimmed.length > MAX_NAME_LENGTH) {
    return NextResponse.json(
      { error: `App name must be ${MAX_NAME_LENGTH} characters or fewer.` },
      { status: 400 }
    );
  }

  await db
    .insert(settings)
    .values({ key: APP_NAME_KEY, value: trimmed })
    .onConflictDoUpdate({ target: settings.key, set: { value: trimmed } });
  return NextResponse.json({ name: trimmed });
}
