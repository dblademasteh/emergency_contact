import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
  const existing = await prisma.faqItem.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "FAQ entry not found." }, { status: 404 });
  }

  const item = await prisma.faqItem.update({
    where: { id },
    data: {
      question,
      answer,
      ...(sortOrder != null ? { sortOrder } : {}),
    },
  });

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
  const existing = await prisma.faqItem.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "FAQ entry not found." }, { status: 404 });
  }

  await prisma.faqItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
