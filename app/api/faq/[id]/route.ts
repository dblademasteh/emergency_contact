import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { faqItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { parseFaqInput } from "@/lib/faq";
import { SESSION_COOKIE, isAdminToken } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, ctx: Ctx) {
  if (!isAdminToken(request.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json(
      { error: "Unauthorized. Admin access required." },
      { status: 401 }
    );
  }

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const parsed = parseFaqInput(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { question, answer, sortOrder } = parsed.data;
  const [existing] = await db
    .select()
    .from(faqItems)
    .where(eq(faqItems.id, id))
    .limit(1);
  if (!existing) {
    return NextResponse.json({ error: "FAQ entry not found." }, { status: 404 });
  }

  const [item] = await db
    .update(faqItems)
    .set({
      question,
      answer,
      ...(sortOrder != null ? { sortOrder } : {}),
    })
    .where(eq(faqItems.id, id))
    .returning();

  return NextResponse.json(item);
}

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
    .from(faqItems)
    .where(eq(faqItems.id, id))
    .limit(1);
  if (!existing) {
    return NextResponse.json({ error: "FAQ entry not found." }, { status: 404 });
  }

  await db.delete(faqItems).where(eq(faqItems.id, id));
  return NextResponse.json({ ok: true });
}