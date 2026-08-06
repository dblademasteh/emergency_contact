import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

const MAX_LOGO_LENGTH = 3_000_000;
const LOGO_PATTERN = /^data:image\/(png|jpeg|webp|gif);base64,/;

export async function POST(request: NextRequest, ctx: Ctx) {
  if (!verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json(
      { error: "Unauthorized. Admin access required." },
      { status: 401 }
    );
  }

  const { id } = await ctx.params;
  const existing = await prisma.group.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Group not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const logo = body && typeof body === "object" ? (body as { logo?: unknown }).logo : undefined;

  if (logo === null || logo === "") {
    await prisma.group.update({ where: { id }, data: { logoUrl: null } });
    return NextResponse.json({ ok: true, logoUrl: null });
  }

  if (typeof logo !== "string") {
    return NextResponse.json(
      { error: "Invalid logo data." },
      { status: 400 }
    );
  }
  if (logo.length > MAX_LOGO_LENGTH) {
    return NextResponse.json(
      { error: "Logo is too large (max 2 MB)." },
      { status: 400 }
    );
  }
  if (!LOGO_PATTERN.test(logo)) {
    return NextResponse.json(
      { error: "Logo must be a PNG, JPEG, WebP, or GIF image." },
      { status: 400 }
    );
  }

  await prisma.group.update({ where: { id }, data: { logoUrl: logo } });
  return NextResponse.json({ ok: true, logoUrl: logo });
}
