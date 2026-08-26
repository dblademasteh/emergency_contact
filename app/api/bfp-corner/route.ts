import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, isAdminToken } from "@/lib/auth";

export async function GET() {
  const entries = await prisma.bfpCornerEntry.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(entries);
}

export async function POST(request: NextRequest) {
  if (!isAdminToken(request.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json(
      { error: "Unauthorized. Admin access required." },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const youtubeUrl = typeof body.youtubeUrl === "string" ? body.youtubeUrl.trim() : "";

  if (!title) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }
  if (!youtubeUrl) {
    return NextResponse.json({ error: "YouTube URL is required." }, { status: 400 });
  }

  const maxSort = await prisma.bfpCornerEntry.aggregate({ _max: { sortOrder: true } });

  const entry = await prisma.bfpCornerEntry.create({
    data: {
      title,
      youtubeUrl,
      sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
