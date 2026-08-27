import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { suggestions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SESSION_COOKIE, isAdminToken } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, ctx: Ctx) {
  if (!isAdminToken(request.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json(
      { error: "Unauthorized. Admin access required." },
      { status: 401 }
    );
  }

  const { id } = await ctx.params;
  const [existing] = await db
    .select()
    .from(suggestions)
    .where(eq(suggestions.id, id))
    .limit(1);
  if (!existing) {
    return NextResponse.json(
      { error: "Suggestion not found." },
      { status: 404 }
    );
  }

  await db.delete(suggestions).where(eq(suggestions.id, id));
  return NextResponse.json({ ok: true });
}