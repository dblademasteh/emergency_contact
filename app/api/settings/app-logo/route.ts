import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SESSION_COOKIE, isAdminToken } from "@/lib/auth";

const APP_LOGO_KEY = "appLogo";
const MAX_LOGO_LENGTH = 20_000_000;
const IMAGE_PATTERN = /^data:image\/(png|jpeg|webp|gif);base64,/;

export async function GET() {
  const [setting] = await db
    .select()
    .from(settings)
    .where(eq(settings.key, APP_LOGO_KEY))
    .limit(1);
  return NextResponse.json({ logo: setting?.value ?? null });
}

export async function POST(request: NextRequest) {
  if (!isAdminToken(request.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json(
      { error: "Unauthorized. Admin access required." },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => null);
  const logo =
    body && typeof body === "object"
      ? (body as { logo?: unknown }).logo
      : undefined;

  if (logo === null || logo === "") {
    await db.delete(settings).where(eq(settings.key, APP_LOGO_KEY));
    return NextResponse.json({ logo: null });
  }

  if (typeof logo !== "string") {
    return NextResponse.json({ error: "Invalid logo data." }, { status: 400 });
  }
  if (logo.length > MAX_LOGO_LENGTH) {
    return NextResponse.json(
      { error: "Image is too large (max 20 MB)." },
      { status: 400 }
    );
  }
  if (!IMAGE_PATTERN.test(logo)) {
    return NextResponse.json(
      { error: "Image must be a PNG, JPEG, WebP, or GIF image." },
      { status: 400 }
    );
  }

  await db
    .insert(settings)
    .values({ key: APP_LOGO_KEY, value: logo })
    .onConflictDoUpdate({ target: settings.key, set: { value: logo } });
  return NextResponse.json({ logo });
}