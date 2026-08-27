import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { suggestions } from "@/db/schema";
import { desc } from "drizzle-orm";
import { parseSuggestionInput } from "@/lib/suggestions";
import { SESSION_COOKIE, isAdminToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  if (!isAdminToken(request.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json(
      { error: "Unauthorized. Admin access required." },
      { status: 401 }
    );
  }

  const items = await db
    .select()
    .from(suggestions)
    .orderBy(desc(suggestions.createdAt));
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = parseSuggestionInput(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const [suggestion] = await db
    .insert(suggestions)
    .values({
      message: parsed.data.message,
      office: parsed.data.office ?? null,
    })
    .returning();

  return NextResponse.json({ ok: true, id: suggestion.id }, { status: 201 });
}