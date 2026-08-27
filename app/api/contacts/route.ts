import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contacts, groups, contactTypes } from "@/db/schema";
import { and, asc, desc, eq, ilike, isNull, or } from "drizzle-orm";
import { parseContactInput } from "@/lib/contacts";
import { SESSION_COOKIE, isEditorToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q")?.trim().toLowerCase() ?? "";
  const type = searchParams.get("type") ?? "";
  const primaryOnly = searchParams.get("primary") === "1";
  const group = searchParams.get("group") ?? "";

  const conditions = [];
  if (q) {
    conditions.push(or(ilike(contacts.name, `%${q}%`), ilike(contacts.phone, `%${q}%`)));
  }
  if (type) conditions.push(eq(contacts.type, type));
  if (primaryOnly) conditions.push(eq(contacts.isPrimary, true));
  if (group === "__root__") {
    conditions.push(isNull(contacts.groupId));
  } else if (group) {
    conditions.push(eq(contacts.groupId, group));
  }

  const rows = await db
    .select()
    .from(contacts)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(contacts.isPrimary), asc(contacts.sortOrder), asc(contacts.name));

  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  if (!isEditorToken(request.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json(
      { error: "Sign in required." },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = parseContactInput(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { data } = parsed;
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
    .insert(contacts)
    .values({
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
    .returning();

  return NextResponse.json(contact, { status: 201 });
}