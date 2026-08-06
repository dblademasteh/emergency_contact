import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  AdminSuggestions,
  type SuggestionItem,
} from "@/components/admin-suggestions";
import { ChevronLeftIcon, MessageSquareIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function AdminSuggestionsPage() {
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session || session.role !== "admin") {
    redirect("/");
  }

  const suggestions = await prisma.suggestion.findMany({
    orderBy: { createdAt: "desc" },
  });
  const items: SuggestionItem[] = suggestions.map((s) => ({
    id: s.id,
    message: s.message,
    office: s.office,
    createdAt: s.createdAt.toISOString(),
  }));

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
            <MessageSquareIcon className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            Suggestions
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Review feedback sent by users.
          </p>
        </div>
      </div>
      <AdminSuggestions initialItems={items} />
    </main>
  );
}
