"use client";

import type { ReactNode } from "react";
import { PhoneIcon } from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { InstallButton } from "@/components/install-button";

type Props = {
  /** Admin-uploaded logo (falls back to the phone glyph on the gradient tile). */
  appLogo?: string | null;
  appName?: string | null;
  /** Secondary line under the app name (e.g. contact counts). */
  subtitle?: ReactNode;
  /** Shows the Admin chip. */
  isAdmin?: boolean;
  /** Shows the compact Sign in pill. */
  showSignIn?: boolean;
};

/**
 * Sticky glass capsule appbar — same floating design language as the
 * bottom docks (guest + admin).
 */
export function AppBar({
  appLogo,
  appName,
  subtitle,
  isAdmin = false,
  showSignIn = false,
}: Props) {
  return (
    <header className="sticky top-2 z-30 mb-5">
      <div className="flex items-center gap-2.5 rounded-3xl border border-slate-200/70 bg-white/80 p-2 pl-2.5 shadow-[0_8px_32px_rgba(15,23,42,0.10)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80">
        {/* Logo tile */}
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-linear-to-br from-rose-500 via-red-600 to-red-800 text-white shadow-md shadow-red-600/25">
          {appLogo ? (
            <img
              src={appLogo}
              alt="App logo"
              className="h-full w-full object-cover"
            />
          ) : (
            <PhoneIcon className="h-5 w-5" />
          )}
        </div>

        {/* Name + subtitle */}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-extrabold leading-tight tracking-tight text-slate-900 dark:text-slate-100">
            {appName || "Beep Me App V2.0"}
          </h1>
          {subtitle != null && (
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1.5">
          {isAdmin && (
            <span className="hidden rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white sm:inline dark:bg-slate-100 dark:text-slate-900">
              Admin
            </span>
          )}
          <ThemeToggle />
          <InstallButton />
          {showSignIn && (
            <a
              href="/login"
              aria-label="Sign in"
              className="inline-flex items-center rounded-full bg-linear-to-r from-rose-600 to-red-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-rose-600/25 transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
            >
              Sign in
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
