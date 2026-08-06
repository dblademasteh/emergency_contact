import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

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
  const setting = await prisma.setting.findUnique({
    where: { key: HOME_CONTENT_LINKS_KEY },
  });
  return NextResponse.json({ links: parseLinks(setting?.value ?? null) });
}

export async function POST(request: NextRequest) {
  if (!verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)) {
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

  await prisma.setting.upsert({
    where: { key: HOME_CONTENT_LINKS_KEY },
    update: { value: JSON.stringify(links) },
    create: { key: HOME_CONTENT_LINKS_KEY, value: JSON.stringify(links) },
  });
  return NextResponse.json({ links });
}
