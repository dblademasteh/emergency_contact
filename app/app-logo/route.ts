import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const APP_LOGO_KEY = "appLogo";
const FALLBACK_ICON = "/icon-512x512.png";

// Serves the admin-uploaded app logo as a real image response so it can be
// used as the PWA app icon (manifest) and apple-touch-icon (iOS splash).
// Falls back to the default static icon when no custom logo is set.
export async function GET(request: NextRequest) {
  const setting = await prisma.setting.findUnique({
    where: { key: APP_LOGO_KEY },
  });
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

  return NextResponse.redirect(new URL(FALLBACK_ICON, request.url), 307);
}
