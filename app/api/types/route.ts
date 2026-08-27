import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contactTypes } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import {
  parseContactTypeInput,
  slugifyTypeValue,
} from "@/lib/contact-types";
import { SESSION_COOKIE, isAdminToken } from "@/lib/auth";

export async function GET() {
  const types = await db
    .select()
    .from(contactTypes)
    .orderBy(asc(contactTypes.sortOrder), asc(contactTypes.label));
  return NextResponse.json(types);
}

export async function POST(request: NextRequest) {
  if (!isAdminToken(request.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json(
      { error: "Unauthorized. Admin access required." },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = parseContactTypeInput(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { data } = parsed;
  const base = slugifyTypeValue(data.label);
  let value = base;
  let counter = 2;
  while (true) {
    const [existing] = await db
      .select({ value: contactTypes.value })
      .from(contactTypes)
      .where(eq(contactTypes.value, value))
      .limit(1);
    if (!existing) break;
    value = `${base}_${counter}`;
    counter += 1;
  }

  const [type] = await db
    .insert(contactTypes)
    .values({
      value,
      label: data.label,
      color: data.color,
      icon: data.icon,
      sortOrder: data.sortOrder ?? 0,
    })
    .returning();

  return NextResponse.json(type, { status: 201 });
}