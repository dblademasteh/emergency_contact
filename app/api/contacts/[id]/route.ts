import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseContactInput } from "@/lib/contacts";
import { SESSION_COOKIE, isEditorToken } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

function isEditor(request: NextRequest): boolean {
  return isEditorToken(request.cookies.get(SESSION_COOKIE)?.value);
}

function unauthorized() {
  return NextResponse.json({ error: "Sign in required." }, { status: 401 });
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  if (!isEditor(request)) return unauthorized();

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

  let type = data.type;
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
    type = group.type;
  } else {
    const typeInfo = await prisma.contactType.findUnique({
      where: { value: data.type },
    });
    if (!typeInfo) {
      return NextResponse.json(
        { error: "Category not found." },
        { status: 400 }
      );
    }
  }

  const contact = await prisma.contact.update({
    where: { id },
    data: {
      name: data.name,
      phone: data.phone,
      type,
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
  if (!isEditor(request)) return unauthorized();

  const { id } = await ctx.params;

  const existing = await prisma.contact.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Contact not found." }, { status: 404 });
  }

  await prisma.contact.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
