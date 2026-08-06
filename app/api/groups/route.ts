import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseGroupInput } from "@/lib/groups";
import { SESSION_COOKIE, isEditorToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type") ?? "";
  const groups = await prisma.group.findMany({
    where: type ? { type } : {},
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return NextResponse.json(groups);
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
    const parent = await prisma.group.findUnique({
      where: { id: data.parentId },
    });
    if (!parent) {
      return NextResponse.json(
        { error: "Parent group not found." },
        { status: 400 }
      );
    }
  }

  const typeInfo = await prisma.contactType.findUnique({
    where: { value: data.type },
  });
  if (!typeInfo) {
    return NextResponse.json(
      { error: "Category not found." },
      { status: 400 }
    );
  }

  const group = await prisma.group.create({
    data: {
      name: data.name,
      type: data.type,
      parentId: data.parentId,
    },
  });

  return NextResponse.json(group, { status: 201 });
}
