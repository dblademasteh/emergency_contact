import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, isAdminToken } from "@/lib/auth";

const HOME_IMAGE_KEY = "homeImage";
const MAX_IMAGE_LENGTH = 20_000_000;
const IMAGE_PATTERN = /^data:image\/(png|jpeg|webp|gif);base64,/;

export async function GET() {
  const setting = await prisma.setting.findUnique({
    where: { key: HOME_IMAGE_KEY },
  });
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
    await prisma.setting.deleteMany({ where: { key: HOME_IMAGE_KEY } });
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

  await prisma.setting.upsert({
    where: { key: HOME_IMAGE_KEY },
    update: { value: image },
    create: { key: HOME_IMAGE_KEY, value: image },
  });
  return NextResponse.json({ image });
}
