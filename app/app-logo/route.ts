import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

const APP_LOGO_KEY = "appLogo";
const FALLBACK_ICON = path.join(process.cwd(), "public", "icon-512x512.png");

// Serves the admin-uploaded app logo as a real image response so it can be
// used as the PWA app icon (manifest) and apple-touch-icon (iOS). Falls back to
// the default static icon (served directly, HTTP 200) when no custom logo is set
// so iOS Safari can cache the home-screen icon without following a redirect.
export async function GET() {
  const [setting] = await db
    .select()
    .from(settings)
    .where(eq(settings.key, APP_LOGO_KEY))
    .limit(1);
  const value = setting?.value;

  if (value) {
    const match = /^data:(image\/(png|jpeg|webp|gif));base64,(.+)$/i.exec(value);
    if (match) {
      const mime = match[1].toLowerCase();
      const base64 = match[3];
      const buffer = Buffer.from(base64, "base64");
      return new Response(new Uint8Array(buffer), {
        headers: {
          "Content-Type": mime,
          "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        },
      });
    }
  }

  const buffer = await readFile(FALLBACK_ICON);
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}