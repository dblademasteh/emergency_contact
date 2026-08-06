import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseContactInput } from "@/lib/contacts";
import { SESSION_COOKIE, isEditorToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q")?.trim().toLowerCase() ?? "";
  const type = searchParams.get("type") ?? "";
  const primaryOnly = searchParams.get("primary") === "1";
  const group = searchParams.get("group") ?? "";

  const where = {
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { phone: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(type ? { type } : {}),
    ...(primaryOnly ? { isPrimary: true } : {}),
    ...(group === "__root__"
      ? { groupId: null }
      : group
        ? { groupId: group }
        : {}),
  };

  const contacts = await prisma.contact.findMany({
    where,
    orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(contacts);
}

export async function POST(request: NextRequest) {
  if (!isEditorToken(request.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json(
      { error: "Sign in required." },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = parseContactInput(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { data } = parsed;
  let type = data.type;
  if (data.groupId) {
    const group = await prisma.group.findUnique({
      where: { id: data.groupId },
    });
    if (!group) {
      return NextResponse.json(
        { error: "Group not found." },
        { status: 400 }
      );
    }
    type = group.type;
  } else {
    const typeInfo = await prisma.contactType.findUnique({
      where: { value: data.type },
    });
    if (!typeInfo) {
      return NextResponse.json(
        { error: "Category not found." },
        { status: 400 }
      );
    }
  }

  const contact = await prisma.contact.create({
    data: {
      name: data.name,
      phone: data.phone,
      type,
      note: data.note ?? null,
      latitude: data.latitude,
      longitude: data.longitude,
      facebookUrl: data.facebookUrl,
      isPrimary: data.isPrimary ?? false,
      groupId: data.groupId,
    },
  });

  return NextResponse.json(contact, { status: 201 });
}
