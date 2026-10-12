"use client";

import type { SVGProps } from "react";
import { HomeIcon, PhoneIcon, ShieldIcon } from "@/components/icons";

export type GuestTab = "home" | "hotlines" | "tips" | "more";

type Props = {
  activeTab: GuestTab;
  onTabChange: (tab: GuestTab) => void;
  /** Phone number for the quick-call button (falls back to 911). */
  emergencyNumber?: string | null;
  /** Focuses the search input on the page. */
  onSearch?: () => void;
};

function MoreIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M6 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
    </svg>
  );
}

const iconBox =
  "flex h-9 w-9 items-center justify-center rounded-full transition group-active:scale-90";

export function GuestBottomNav({ activeTab, onTabChange }: Props) {
  const inactiveIconBox =
    "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-slate-700 dark:group-hover:text-slate-200";
  const inactiveText = "text-slate-500 dark:text-slate-400";
  const activeText = "text-rose-600 dark:text-rose-400";
  const activeIconBox =
    "bg-linear-to-br from-rose-500 to-red-600 text-white shadow-lg shadow-rose-600/30 group-hover:scale-105";

  const buttonCls = (active: boolean) =>
    `group flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-2 transition active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50 ${
      active ? activeText : inactiveText
    } hover:bg-slate-100/80 dark:hover:bg-slate-800/80`;

  const renderItem = (
    key: GuestTab,
    label: string,
    Icon: typeof HomeIcon | typeof MoreIcon,
  ) => {
    const active = activeTab === key;
    return (
      <button
        key={key}
        type="button"
        onClick={() => onTabChange(key)}
        aria-current={active ? "page" : undefined}
        aria-label={label}
        className={buttonCls(active)}
      >
        <span className={`${iconBox} ${active ? activeIconBox : inactiveIconBox}`}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <span className="text-[11px] font-bold tracking-wide">{label}</span>
      </button>
    );
  };

  return (
    <nav
      aria-label="Primary"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4"
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <div className="pointer-events-auto mx-auto flex max-w-[400px] items-stretch gap-1 rounded-3xl border border-slate-200/70 bg-white/90 p-1.5 shadow-[0_12px_40px_rgba(15,23,42,0.18)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">
        {renderItem("home", "Home", HomeIcon)}
        {renderItem("hotlines", "Hotlines", PhoneIcon)}
        {renderItem("tips", "Safety Tips", ShieldIcon)}
        {renderItem("more", "More", MoreIcon)}
      </div>
    </nav>
  );
}