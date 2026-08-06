import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  parseContactTypeInput,
  slugifyTypeValue,
} from "@/lib/contact-types";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

export async function GET() {
  const types = await prisma.contactType.findMany({
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
  });
  return NextResponse.json(types);
}

export async function POST(request: NextRequest) {
  if (!verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json(
      { error: "Unauthorized. Admin access required." },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = parseContactTypeInput(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { data } = parsed;
  const base = slugifyTypeValue(data.label);
  let value = base;
  let counter = 2;
  while (await prisma.contactType.findUnique({ where: { value } })) {
    value = `${base}_${counter}`;
    counter += 1;
  }

  const type = await prisma.contactType.create({
    data: {
      value,
      label: data.label,
      color: data.color,
      icon: data.icon,
      sortOrder: data.sortOrder ?? 0,
    },
  });

  return NextResponse.json(type, { status: 201 });
}
