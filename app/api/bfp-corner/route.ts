import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bfpCornerEntries } from "@/db/schema";
import { asc, eq, max } from "drizzle-orm";
import { SESSION_COOKIE, isAdminToken } from "@/lib/auth";

export async function GET() {
  const entries = await db
    .select()
    .from(bfpCornerEntries)
    .orderBy(asc(bfpCornerEntries.sortOrder), asc(bfpCornerEntries.createdAt));
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

  const [maxRow] = await db
    .select({ value: max(bfpCornerEntries.sortOrder) })
    .from(bfpCornerEntries);
  const nextSort = (maxRow?.value ?? 0) + 1;

  const [entry] = await db
    .insert(bfpCornerEntries)
    .values({ title, youtubeUrl, sortOrder: nextSort })
    .returning();

  return NextResponse.json(entry, { status: 201 });
}