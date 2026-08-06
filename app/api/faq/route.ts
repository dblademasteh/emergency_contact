import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseFaqInput } from "@/lib/faq";
import { SESSION_COOKIE, isAdminToken } from "@/lib/auth";

export async function GET() {
  const items = await prisma.faqItem.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
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
  const count = await prisma.faqItem.count();
  const item = await prisma.faqItem.create({
    data: {
      question,
      answer,
      sortOrder: sortOrder ?? count,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
