"use client";

import { HomeIcon, PhoneIcon, SearchIcon } from "@/components/icons";

type Props = {
  /** Phone number for the quick-call button (falls back to 911). */
  emergencyNumber?: string | null;
  /** Focuses the search input on the page. */
  onSearch?: () => void;
};

const itemBase =
  "flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 text-sm font-semibold transition active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500";

export function GuestBottomNav({ emergencyNumber, onSearch }: Props) {
  const tel = (emergencyNumber ?? "911").replace(/\s+/g, "");

  return (
    <nav
      aria-label="Quick actions"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4"
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <div className="pointer-events-auto mx-auto flex max-w-md items-center gap-1 rounded-full border border-slate-200/70 bg-white/90 p-1.5 shadow-[0_12px_40px_rgba(15,23,42,0.18)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">
        {/* Home — current page */}
        <button
          type="button"
          aria-current="page"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className={`${itemBase} bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300`}
        >
          <HomeIcon className="h-4 w-4" />
          Home
        </button>

        {/* Search — jumps to the search field */}
        <button
          type="button"
          onClick={onSearch}
          className={`${itemBase} text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100`}
        >
          <SearchIcon className="h-4 w-4" />
          Search
        </button>

        {/* Emergency quick call */}
        <a
          href={`tel:${tel}`}
          className={`${itemBase} bg-linear-to-r from-rose-600 to-red-600 font-bold text-white shadow-md shadow-rose-600/25 hover:brightness-110`}
        >
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
          </span>
          <PhoneIcon className="h-4 w-4" />
          Call
        </a>

        {/* Sign in */}
        <a
          href="/login"
          className={`${itemBase} border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-rose-200 hover:text-rose-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-rose-500/40 dark:hover:text-rose-300`}
        >
          Sign in
        </a>
      </div>
    </nav>
  );
}