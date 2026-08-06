import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

// Read live from the DB so admin-uploaded logos apply without a rebuild.
export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const setting = await prisma.setting.findUnique({
    where: { key: "appLogo" },
  });
  const hasLogo = Boolean(setting?.value);
  const iconSrc = hasLogo ? "/app-logo" : "/icon-512x512.png";
  const icon192 = hasLogo ? "/app-logo" : "/icon-192x192.png";

  return {
    name: "Emergency Contacts",
    short_name: "Emergency",
    description:
      "Your personal directory for emergency contacts — police, fire, medical, family and more. Works offline.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f8fafc",
    theme_color: "#0f172a",
    categories: ["utilities", "health", "safety"],
    icons: [
      {
        src: icon192,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: iconSrc,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: iconSrc,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
