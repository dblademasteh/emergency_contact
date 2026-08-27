import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { faqItems } from "@/db/schema";
import { asc, count } from "drizzle-orm";
import { parseFaqInput } from "@/lib/faq";
import { SESSION_COOKIE, isAdminToken } from "@/lib/auth";

export async function GET() {
  const items = await db
    .select()
    .from(faqItems)
    .orderBy(asc(faqItems.sortOrder), asc(faqItems.createdAt));
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  if (!isAdminToken(request.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json(
      { error: "Unauthorized. Admin access required." },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = parseFaqInput(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { question, answer, sortOrder } = parsed.data;
  const [{ value: existingCount }] = await db
    .select({ value: count() })
    .from(faqItems);
  const [item] = await db
    .insert(faqItems)
    .values({
      question,
      answer,
      sortOrder: sortOrder ?? existingCount,
    })
    .returning();

  return NextResponse.json(item, { status: 201 });
}