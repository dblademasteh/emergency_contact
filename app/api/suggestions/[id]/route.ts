import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
  const existing = await prisma.suggestion.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Suggestion not found." },
      { status: 404 }
    );
  }

  await prisma.suggestion.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
