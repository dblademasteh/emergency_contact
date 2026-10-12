"use client";

import { useEffect, useState } from "react";
import type { GuestTab } from "@/components/guest-bottom-nav";
import {
  HomeIcon,
  PhoneIcon,
  ShieldIcon,
  SearchIcon,
} from "@/components/icons";

type Props = {
  logo: string | null;
  title?: string;
  subtitle?: string;
  activeTab: GuestTab;
  onNavigate: (tab: GuestTab) => void;
  onSearch: () => void;
  emergencyTel: string;
};

export const HEADER_LOGO_SRC: string | null = null;

function MoreIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z" />
    </svg>
  );
}

function SafeLogo({ src, iconClassName }: { src: string | null; iconClassName: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return <ShieldIcon className={iconClassName} />;
  }
  return (
    <img
      src={src}
      alt=""
      onError={() => setFailed(true)}
      className="h-full w-full object-cover"
    />
  );
}

const drawerBtn =
  "flex min-h-[52px] w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold transition active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50";

export function UserHeader({
  logo,
  title = "Bureau of Fire Protection",
  subtitle = "Region 02",
  activeTab,
  onNavigate,
  onSearch,
  emergencyTel,
}: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open ]);

  const go = (tab: GuestTab) => {
    setOpen(false);
    onNavigate(tab);
  };

  // Uploaded app logo wins; otherwise use the BFP seal file in /public.
  const logoSrc = logo ?? HEADER_LOGO_SRC;

  const itemCls = (active: boolean) =>
    `${drawerBtn} ${
      active
        ? "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300"
        : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
    }`;

  return (
    <>
      <header className="mb-4 flex items-center gap-3">
        {/* Image container */}
        <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 text-rose-600 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-rose-400">
          <SafeLogo src={logoSrc} iconClassName="h-6 w-6" />
        </span>
        <span className="min-w-0 flex-1">
          {/* 1st line */}
          <span className="block truncate text-[15px] font-extrabold leading-tight tracking-tight text-slate-900 dark:text-slate-100">
            {title}
          </span>
          {/* 2nd line */}
          <span className="block text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {subtitle}
          </span>
        </span>
        {/* 3rd line: hamburger opens the drawer */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-haspopup="dialog"
          aria-expanded={open}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <MoreIcon className="h-5 w-5" />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="absolute bottom-0 right-0 top-0 flex w-[85%] max-w-xs flex-col bg-white shadow-2xl dark:bg-slate-950"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-4 dark:border-slate-800">
              <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100 text-rose-600 dark:border-slate-700 dark:bg-slate-800 dark:text-rose-400">
                <SafeLogo src={logoSrc} iconClassName="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  {title}
                </span>
                <span className="block text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  {subtitle}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <nav aria-label="Menu" className="flex-1 space-y-1 overflow-y-auto p-3">
              <button type="button" onClick={() => go("home")} className={itemCls(activeTab === "home")}>
                <HomeIcon className="h-5 w-5" /> Home
              </button>
              <button type="button" onClick={() => go("hotlines")} className={itemCls(activeTab === "hotlines")}>
                <PhoneIcon className="h-5 w-5" /> Hotlines
              </button>
              <button type="button" onClick={() => go("tips")} className={itemCls(activeTab === "tips")}>
                <ShieldIcon className="h-5 w-5" /> Safety Tips
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onSearch();
                }}
                className={itemCls(false)}
              >
                <SearchIcon className="h-5 w-5" /> Search contacts
              </button>
              <a href={`tel:${emergencyTel}`} className={`${drawerBtn} bg-linear-to-r from-rose-600 to-red-600 font-bold text-white shadow-md shadow-rose-600/25 hover:brightness-110`}>
                <PhoneIcon className="h-5 w-5" /> Call 911
              </a>
              <a href="/login" className={itemCls(false)}>
                <HomeIcon className="h-5 w-5" /> Sign in
              </a>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
