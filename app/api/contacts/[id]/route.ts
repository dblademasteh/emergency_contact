import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contacts, groups, contactTypes } from "@/db/schema";
import { eq } from "drizzle-orm";
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
  const [existing] = await db
    .select()
    .from(contacts)
    .where(eq(contacts.id, id))
    .limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Contact not found." }, { status: 404 });
  }

  let type = data.type;
  if (data.groupId) {
    const [group] = await db
      .select()
      .from(groups)
      .where(eq(groups.id, data.groupId))
      .limit(1);
    if (!group) {
      return NextResponse.json(
        { error: "Group not found." },
        { status: 400 }
      );
    }
    type = group.type;
  } else {
    const [typeInfo] = await db
      .select()
      .from(contactTypes)
      .where(eq(contactTypes.value, data.type))
      .limit(1);
    if (!typeInfo) {
      return NextResponse.json(
        { error: "Category not found." },
        { status: 400 }
      );
    }
  }

  const [contact] = await db
    .update(contacts)
    .set({
      name: data.name,
      phone: data.phone,
      type,
      note: data.note ?? null,
      latitude: data.latitude,
      longitude: data.longitude,
      facebookUrl: data.facebookUrl,
      isPrimary: data.isPrimary ?? false,
      groupId: data.groupId,
    })
    .where(eq(contacts.id, id))
    .returning();

  return NextResponse.json(contact);
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  if (!isEditor(request)) return unauthorized();

  const { id } = await ctx.params;

  const [existing] = await db
    .select()
    .from(contacts)
    .where(eq(contacts.id, id))
    .limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Contact not found." }, { status: 404 });
  }

  await db.delete(contacts).where(eq(contacts.id, id));
  return NextResponse.json({ ok: true });
}