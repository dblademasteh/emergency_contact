import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contacts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SESSION_COOKIE, isEditorToken } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

const MAX_LOGO_LENGTH = 20_000_000;
const LOGO_PATTERN = /^data:image\/(png|jpeg|webp|gif);base64,/;

export async function POST(request: NextRequest, ctx: Ctx) {
  if (!isEditorToken(request.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json(
      { error: "Sign in required." },
      { status: 401 }
    );
  }

  const { id } = await ctx.params;
  const [existing] = await db
    .select()
    .from(contacts)
    .where(eq(contacts.id, id))
    .limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Contact not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const logo =
    body && typeof body === "object"
      ? (body as { logo?: unknown }).logo
      : undefined;

  if (logo === null || logo === "") {
    const [updated] = await db
      .update(contacts)
      .set({ logoUrl: null })
      .where(eq(contacts.id, id))
      .returning();
    return NextResponse.json({ ok: true, logoUrl: null });
  }

  if (typeof logo !== "string") {
    return NextResponse.json({ error: "Invalid logo data." }, { status: 400 });
  }
  if (logo.length > MAX_LOGO_LENGTH) {
    return NextResponse.json(
      { error: "Logo is too large (max 20 MB)." },
      { status: 400 }
    );
  }
  if (!LOGO_PATTERN.test(logo)) {
    return NextResponse.json(
      { error: "Logo must be a PNG, JPEG, WebP, or GIF image." },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(contacts)
    .set({ logoUrl: logo })
    .where(eq(contacts.id, id))
    .returning();
  return NextResponse.json({ ok: true, logoUrl: updated.logoUrl });
}