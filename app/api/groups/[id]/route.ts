import { NextRequest, NextResponse } from "next/server";
import { ContactType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseGroupInput } from "@/lib/groups";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

function isAdmin(request: NextRequest): boolean {
  return verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value) !== null;
}

function unauthorized() {
  return NextResponse.json(
    { error: "Unauthorized. Admin access required." },
    { status: 401 }
  );
}

function isDescendant(
  candidateId: string,
  targetId: string,
  parentById: Map<string, string | null>
): boolean {
  let current: string | null | undefined = candidateId;
  while (current) {
    if (current === targetId) return true;
    current = parentById.get(current);
  }
  return false;
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  if (!isAdmin(request)) return unauthorized();

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const parsed = parseGroupInput(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const existing = await prisma.group.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Group not found." }, { status: 404 });
  }

  const { data } = parsed;
  if (data.parentId && data.parentId !== existing.parentId) {
    const parent = await prisma.group.findUnique({
      where: { id: data.parentId },
    });
    if (!parent) {
      return NextResponse.json(
        { error: "Parent group not found." },
        { status: 400 }
      );
    }

    const all = await prisma.group.findMany({ select: { id: true, parentId: true } });
    const parentById = new Map(all.map((g) => [g.id, g.parentId]));
    if (isDescendant(data.parentId, id, parentById)) {
      return NextResponse.json(
        { error: "A group cannot be nested inside itself." },
        { status: 400 }
      );
    }
  }

  const group = await prisma.group.update({
    where: { id },
    data: {
      name: data.name,
      type: data.type as ContactType,
      parentId: data.parentId,
    },
  });

  return NextResponse.json(group);
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  if (!isAdmin(request)) return unauthorized();

  const { id } = await ctx.params;
  const existing = await prisma.group.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Group not found." }, { status: 404 });
  }

  await prisma.group.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
