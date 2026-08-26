import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, isAdminToken } from "@/lib/auth";

const SETTING_KEY = "facebookPageUrl";

export async function GET() {
  const setting = await prisma.setting.findUnique({
    where: { key: SETTING_KEY },
  });
  return NextResponse.json({ url: setting?.value ?? null });
}

export async function POST(request: NextRequest) {
  if (!isAdminToken(request.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json(
      { error: "Unauthorized. Admin access required." },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => null);
  const url =
    body && typeof body === "object"
      ? (body as { url?: unknown }).url
      : undefined;

  if (url === null || url === undefined || url === "") {
    await prisma.setting.deleteMany({ where: { key: SETTING_KEY } });
    return NextResponse.json({ url: null });
  }

  if (typeof url !== "string") {
    return NextResponse.json({ error: "Invalid URL." }, { status: 400 });
  }

  const trimmed = url.trim();
  if (trimmed.length > 500) {
    return NextResponse.json({ error: "URL is too long." }, { status: 400 });
  }

  await prisma.setting.upsert({
    where: { key: SETTING_KEY },
    update: { value: trimmed },
    create: { key: SETTING_KEY, value: trimmed },
  });
  return NextResponse.json({ url: trimmed });
}
