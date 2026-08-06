import { NextRequest, NextResponse } from "next/server";
import { ContactType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseContactInput } from "@/lib/contacts";
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

export async function PATCH(request: NextRequest, ctx: Ctx) {
  if (!isAdmin(request)) return unauthorized();

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const parsed = parseContactInput(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { data } = parsed;
  const existing = await prisma.contact.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Contact not found." }, { status: 404 });
  }

  let groupType: ContactType | null = null;
  if (data.groupId) {
    const group = await prisma.group.findUnique({
      where: { id: data.groupId },
    });
    if (!group) {
      return NextResponse.json(
        { error: "Group not found." },
        { status: 400 }
      );
    }
    groupType = group.type;
  }

  const contact = await prisma.contact.update({
    where: { id },
    data: {
      name: data.name,
      phone: data.phone,
      type: (groupType ?? data.type) as ContactType,
      note: data.note ?? null,
      latitude: data.latitude,
      longitude: data.longitude,
      facebookUrl: data.facebookUrl,
      isPrimary: data.isPrimary ?? false,
      groupId: data.groupId,
    },
  });

  return NextResponse.json(contact);
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  if (!isAdmin(request)) return unauthorized();

  const { id } = await ctx.params;

  const existing = await prisma.contact.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Contact not found." }, { status: 404 });
  }

  await prisma.contact.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
