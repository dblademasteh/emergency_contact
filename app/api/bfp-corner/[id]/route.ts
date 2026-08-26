import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, isAdminToken } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

function unauthorized() {
  return NextResponse.json(
    { error: "Unauthorized. Admin access required." },
    { status: 401 }
  );
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  if (!isAdminToken(request.cookies.get(SESSION_COOKIE)?.value)) return unauthorized();

  const { id } = await ctx.params;
  const existing = await prisma.bfpCornerEntry.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Entry not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const data: { title?: string; youtubeUrl?: string; sortOrder?: number } = {};
  if (typeof body.title === "string") data.title = body.title.trim();
  if (typeof body.youtubeUrl === "string") data.youtubeUrl = body.youtubeUrl.trim();
  if (typeof body.sortOrder === "number") data.sortOrder = body.sortOrder;

  const entry = await prisma.bfpCornerEntry.update({ where: { id }, data });
  return NextResponse.json(entry);
}

export async function DELETE(_request: NextRequest, ctx: Ctx) {
  if (!isAdminToken(_request.cookies.get(SESSION_COOKIE)?.value)) return unauthorized();

  const { id } = await ctx.params;
  const existing = await prisma.bfpCornerEntry.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Entry not found." }, { status: 404 });
  }

  await prisma.bfpCornerEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
