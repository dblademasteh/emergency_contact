import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseContactTypeInput } from "@/lib/contact-types";
import { SESSION_COOKIE, isAdminToken } from "@/lib/auth";

type Ctx = { params: Promise<{ value: string }> };

function isAdmin(request: NextRequest): boolean {
  return isAdminToken(request.cookies.get(SESSION_COOKIE)?.value);
}

function unauthorized() {
  return NextResponse.json(
    { error: "Unauthorized. Admin access required." },
    { status: 401 }
  );
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  if (!isAdmin(request)) return unauthorized();

  const { value } = await ctx.params;
  const body = await request.json().catch(() => null);
  const parsed = parseContactTypeInput(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const existing = await prisma.contactType.findUnique({ where: { value } });
  if (!existing) {
    return NextResponse.json({ error: "Category not found." }, { status: 404 });
  }

  const { data } = parsed;
  const type = await prisma.contactType.update({
    where: { value },
    data: {
      label: data.label,
      color: data.color,
      icon: data.icon,
      sortOrder: data.sortOrder ?? existing.sortOrder,
    },
  });

  return NextResponse.json(type);
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  if (!isAdmin(request)) return unauthorized();

  const { value } = await ctx.params;
  const existing = await prisma.contactType.findUnique({ where: { value } });
  if (!existing) {
    return NextResponse.json({ error: "Category not found." }, { status: 404 });
  }

  const all = await prisma.contactType.findMany({
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
  });
  if (all.length <= 1) {
    return NextResponse.json(
      { error: "Cannot delete the last remaining category." },
      { status: 400 }
    );
  }

  const fallback =
    all.find((t) => t.value === "OTHER" && t.value !== value) ??
    all.find((t) => t.value !== value)!;

  await prisma.$transaction([
    prisma.contact.updateMany({
      where: { type: value },
      data: { type: fallback.value },
    }),
    prisma.group.updateMany({
      where: { type: value },
      data: { type: fallback.value },
    }),
    prisma.contactType.delete({ where: { value } }),
  ]);

  return NextResponse.json({ ok: true });
}
