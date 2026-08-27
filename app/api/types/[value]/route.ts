import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contactTypes, contacts, groups } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
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

  const [existing] = await db
    .select()
    .from(contactTypes)
    .where(eq(contactTypes.value, value))
    .limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Category not found." }, { status: 404 });
  }

  const { data } = parsed;
  const [type] = await db
    .update(contactTypes)
    .set({
      label: data.label,
      color: data.color,
      icon: data.icon,
      sortOrder: data.sortOrder ?? existing.sortOrder,
    })
    .where(eq(contactTypes.value, value))
    .returning();

  return NextResponse.json(type);
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  if (!isAdmin(request)) return unauthorized();

  const { value } = await ctx.params;
  const [existing] = await db
    .select()
    .from(contactTypes)
    .where(eq(contactTypes.value, value))
    .limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Category not found." }, { status: 404 });
  }

  const all = await db
    .select()
    .from(contactTypes)
    .orderBy(asc(contactTypes.sortOrder), asc(contactTypes.label));
  if (all.length <= 1) {
    return NextResponse.json(
      { error: "Cannot delete the last remaining category." },
      { status: 400 }
    );
  }

  const fallback =
    all.find((t) => t.value === "OTHER" && t.value !== value) ??
    all.find((t) => t.value !== value)!;

  await db.transaction(async (tx) => {
    await tx
      .update(contacts)
      .set({ type: fallback.value })
      .where(eq(contacts.type, value));
    await tx
      .update(groups)
      .set({ type: fallback.value })
      .where(eq(groups.type, value));
    await tx.delete(contactTypes).where(eq(contactTypes.value, value));
  });

  return NextResponse.json({ ok: true });
}