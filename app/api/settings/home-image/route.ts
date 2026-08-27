import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SESSION_COOKIE, isAdminToken } from "@/lib/auth";

const HOME_IMAGE_KEY = "homeImage";
const MAX_IMAGE_LENGTH = 20_000_000;
const IMAGE_PATTERN = /^data:image\/(png|jpeg|webp|gif);base64,/;

export async function GET() {
  const [setting] = await db
    .select()
    .from(settings)
    .where(eq(settings.key, HOME_IMAGE_KEY))
    .limit(1);
  return NextResponse.json({ image: setting?.value ?? null });
}

export async function POST(request: NextRequest) {
  if (!isAdminToken(request.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json(
      { error: "Unauthorized. Admin access required." },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => null);
  const image =
    body && typeof body === "object"
      ? (body as { image?: unknown }).image
      : undefined;

  if (image === null || image === "") {
    await db.delete(settings).where(eq(settings.key, HOME_IMAGE_KEY));
    return NextResponse.json({ image: null });
  }

  if (typeof image !== "string") {
    return NextResponse.json({ error: "Invalid image data." }, { status: 400 });
  }
  if (image.length > MAX_IMAGE_LENGTH) {
    return NextResponse.json(
      { error: "Image is too large (max 20 MB)." },
      { status: 400 }
    );
  }
  if (!IMAGE_PATTERN.test(image)) {
    return NextResponse.json(
      { error: "Image must be a PNG, JPEG, WebP, or GIF image." },
      { status: 400 }
    );
  }

  await db
    .insert(settings)
    .values({ key: HOME_IMAGE_KEY, value: image })
    .onConflictDoUpdate({ target: settings.key, set: { value: image } });
  return NextResponse.json({ image });
}