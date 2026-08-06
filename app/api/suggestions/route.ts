import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseSuggestionInput } from "@/lib/suggestions";
import { SESSION_COOKIE, isAdminToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  if (!isAdminToken(request.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json(
      { error: "Unauthorized. Admin access required." },
      { status: 401 }
    );
  }

  const items = await prisma.suggestion.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = parseSuggestionInput(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const suggestion = await prisma.suggestion.create({
    data: {
      message: parsed.data.message,
      office: parsed.data.office ?? null,
    },
  });

  return NextResponse.json({ ok: true, id: suggestion.id }, { status: 201 });
}
