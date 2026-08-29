import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { AdminSettings } from "@/components/admin-settings";
import type { HomeContentLink } from "@/components/home-image";
import { ChevronLeftIcon, SettingsIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

const KEYS = [
  "appName",
  "appLogo",
  "homeImage",
  "homeContentImage",
  "homeContentLinks",
  "facebookPageUrl",
  "bfpSiteUrl",
] as const;

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
        label: String(l.label ?? "").trim(),
        href: String(l.href ?? "").trim(),
      }))
      .filter((l) => l.label && l.href);
  } catch {
    return [];
  }
}

export default async function AdminSettingsPage() {
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session || session.role !== "admin") {
    redirect("/");
  }

  const rows = await db.select().from(settings);
  const byKey = new Map(rows.map((r) => [r.key, r.value]));

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/"
          aria-label="Back to home"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            <SettingsIcon className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            Settings
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage the app name, logo, home page, and BFP updates.
          </p>
        </div>
      </div>

      <AdminSettings
        appName={byKey.get("appName") ?? null}
        appLogo={byKey.get("appLogo") ?? null}
        homeImage={byKey.get("homeImage") ?? null}
        homeContentImage={byKey.get("homeContentImage") ?? null}
        homeContentLinks={parseLinks(byKey.get("homeContentLinks") ?? null)}
        facebookPageUrl={byKey.get("facebookPageUrl") ?? null}
        bfpSiteUrl={byKey.get("bfpSiteUrl") ?? null}
      />
    </main>
  );
}
