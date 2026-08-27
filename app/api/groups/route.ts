import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { groups, contactTypes } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { parseGroupInput } from "@/lib/groups";
import { SESSION_COOKIE, isEditorToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type") ?? "";
  const rows = await db
    .select()
    .from(groups)
    .where(type ? eq(groups.type, type) : undefined)
    .orderBy(asc(groups.sortOrder), asc(groups.name));
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
  const parsed = parseGroupInput(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { data } = parsed;
  if (data.parentId) {
    const [parent] = await db
      .select()
      .from(groups)
      .where(eq(groups.id, data.parentId))
      .limit(1);
    if (!parent) {
      return NextResponse.json(
        { error: "Parent group not found." },
        { status: 400 }
      );
    }
  }

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

  const [group] = await db
    .insert(groups)
    .values({
      name: data.name,
      type: data.type,
      parentId: data.parentId,
    })
    .returning();

  return NextResponse.json(group, { status: 201 });
}