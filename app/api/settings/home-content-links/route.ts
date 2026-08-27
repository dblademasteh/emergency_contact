import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SESSION_COOKIE, isAdminToken } from "@/lib/auth";

const HOME_CONTENT_LINKS_KEY = "homeContentLinks";
const MAX_LABEL_LENGTH = 40;
const MAX_HREF_LENGTH = 500;
const DANGEROUS_HREF = /^(?:javascript|data|vbscript):/i;

export type HomeContentLink = { label: string; href: string };

function parseLinks(value: string | null): HomeContentLink[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (l): l is { label?: unknown; href?: unknown } =>
          !!l && typeof l === "object"
      )
      .map((l) => ({
        label: String(l.label ?? "")
          .trim()
          .slice(0, MAX_LABEL_LENGTH),
        href: String(l.href ?? "")
          .trim()
          .slice(0, MAX_HREF_LENGTH),
      }))
      .filter((l) => l.label && l.href);
  } catch {
    return [];
  }
}

export async function GET() {
  const [setting] = await db
    .select()
    .from(settings)
    .where(eq(settings.key, HOME_CONTENT_LINKS_KEY))
    .limit(1);
  return NextResponse.json({ links: parseLinks(setting?.value ?? null) });
}

export async function POST(request: NextRequest) {
  if (!isAdminToken(request.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json(
      { error: "Unauthorized. Admin access required." },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => null);
  const rawLinks =
    body && typeof body === "object"
      ? (body as { links?: unknown }).links
      : undefined;

  const links: HomeContentLink[] = [];
  if (rawLinks !== null && rawLinks !== undefined) {
    if (!Array.isArray(rawLinks)) {
      return NextResponse.json({ error: "Invalid links data." }, { status: 400 });
    }
    if (rawLinks.length > 2) {
      return NextResponse.json({ error: "Maximum of 2 links." }, { status: 400 });
    }
    for (const item of rawLinks) {
      if (!item || typeof item !== "object") {
        return NextResponse.json({ error: "Invalid link data." }, { status: 400 });
      }
      const label = String((item as { label?: unknown }).label ?? "").trim();
      const href = String((item as { href?: unknown }).href ?? "").trim();
      if (!label || !href) {
        return NextResponse.json(
          { error: "Each link needs a label and URL." },
          { status: 400 }
        );
      }
      if (label.length > MAX_LABEL_LENGTH) {
        return NextResponse.json(
          { error: "Link label is too long (max 40 characters)." },
          { status: 400 }
        );
      }
      if (href.length > MAX_HREF_LENGTH) {
        return NextResponse.json(
          { error: "Link URL is too long." },
          { status: 400 }
        );
      }
      if (DANGEROUS_HREF.test(href)) {
        return NextResponse.json(
          { error: "That URL isn't allowed." },
          { status: 400 }
        );
      }
      links.push({ label, href });
    }
  }

  const json = JSON.stringify(links);
  await db
    .insert(settings)
    .values({ key: HOME_CONTENT_LINKS_KEY, value: json })
    .onConflictDoUpdate({ target: settings.key, set: { value: json } });
  return NextResponse.json({ links });
}