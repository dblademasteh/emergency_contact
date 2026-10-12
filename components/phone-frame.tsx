"use client";

import { useEffect, useState, type ReactNode } from "react";

function formatNow() {
  return new Date().toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
  });
}

function useNow() {
  const [now, setNow] = useState<string>(() => {
    try {
      if (typeof window !== "undefined") return formatNow();
    } catch {
      /* keep fallback */
    }
    return "9:41";
  });
  useEffect(() => {
    const id = window.setInterval(() => {
      try {
        setNow(formatNow());
      } catch {
        /* ignore */
      }
    }, 30_000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

/**
 * Simulated iOS status bar — time, Dynamic Island, signal/wifi/battery.
 * Rendered inside the centered phone so the app reads as a handset,
 * even on desktop.
 */
export function IosStatusBar() {
  const time = useNow();
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none relative z-30 flex h-11 shrink-0 select-none items-center justify-between bg-white px-6 pt-1 text-slate-900 dark:bg-slate-950 dark:text-slate-100"
    >
      <span className="w-12 text-[13px] font-semibold tracking-tight">{time}</span>
      {/* Dynamic Island */}
      <span className="absolute left-1/2 top-2 h-[26px] w-[110px] -translate-x-1/2 rounded-full bg-black shadow-inner" />
      <span className="flex w-auto items-center justify-end gap-1.5">
        {/* Signal */}
        <svg viewBox="0 0 18 12" className="h-3 w-[18px]" fill="currentColor">
          <rect x="0" y="7" width="3" height="5" rx="0.8" />
          <rect x="4.5" y="5" width="3" height="7" rx="0.8" />
          <rect x="9" y="2.5" width="3" height="9.5" rx="0.8" />
          <rect x="13.5" y="0" width="3" height="12" rx="0.8" />
        </svg>
        {/* Wifi */}
        <svg viewBox="0 0 16 12" className="h-3 w-4" fill="currentColor">
          <path d="M8 9.6a1.6 1.6 0 1 1 0 3.2 1.6 1.6 0 0 1 0-3.2zM8 5.4c1.8 0 3.4.7 4.6 1.9l-1.5 1.5A4.4 4.4 0 0 0 8 7.8c-1.2 0-2.3.4-3.1 1L3.4 7.3A6.4 6.4 0 0 1 8 5.4zM8 1c2.9 0 5.6 1.2 7.6 3.1L14 5.6A8.6 8.6 0 0 0 8 3.4c-2.3 0-4.4.9-6 2.2L.4 4.1A11 11 0 0 1 8 1z" />
        </svg>
        {/* Battery */}
        <svg viewBox="0 0 25 12" className="h-3 w-[25px]" fill="none">
          <rect
            x="0.5"
            y="0.5"
            width="21"
            height="11"
            rx="3"
            stroke="currentColor"
            strokeOpacity="0.4"
          />
          <rect x="2" y="2" width="15" height="8" rx="1.8" fill="currentColor" />
          <path
            d="M23.5 4v4a2 2 0 0 0 0-4z"
            fill="currentColor"
            fillOpacity="0.4"
          />
        </svg>
      </span>
    </div>
  );
}

/**
 * Center-layout simulated smartphone.
 *
 * - Mobile: full-bleed, status bar pinned at the top.
 * - sm+: centered handset (max-w 400px) with bezel, side buttons,
 *   soft shadow and ambient backdrop — content stays in single-hand reach.
 */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full flex-1 justify-center sm:px-6 sm:py-8">
      {/* Ambient side copy — desktop only, keeps focus centered */}
      <div
        aria-hidden="true"
        className="pointer-events-none hidden w-56 shrink-0 select-none self-center pr-8 lg:block xl:w-72"
      >
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-500">
          Emergency ready
        </p>
        <p className="mt-2 text-2xl font-black leading-tight tracking-tight text-slate-900 dark:text-slate-100">
          Help is one tap away.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          Pinned 911 banner, agency hotlines and safety tips — laid out for
          one-handed use.
        </p>
      </div>

      <div className="relative w-full max-w-[430px]">
        {/* Side buttons (desktop bezel detail) */}
        <span
          aria-hidden="true"
          className="absolute -left-[13px] top-28 hidden h-10 w-[3px] rounded-l-md bg-slate-800 sm:block dark:bg-slate-600"
        />
        <span
          aria-hidden="true"
          className="absolute -left-[13px] top-44 hidden h-14 w-[3px] rounded-l-md bg-slate-800 sm:block dark:bg-slate-600"
        />
        <span
          aria-hidden="true"
          className="absolute -right-[13px] top-36 hidden h-16 w-[3px] rounded-r-md bg-slate-800 sm:block dark:bg-slate-600"
        />

        <div className="relative flex w-full flex-col overflow-hidden bg-white shadow-[0_24px_64px_-24px_rgba(15,23,42,0.35)] sm:rounded-[3rem] sm:border-[10px] sm:border-slate-950 sm:shadow-[0_32px_80px_-16px_rgba(15,23,42,0.45)] dark:bg-slate-950 dark:sm:border-black dark:sm:shadow-[0_32px_80px_-16px_rgba(0,0,0,0.8)]">
          <div className="sticky top-0 z-30">
            <IosStatusBar />
          </div>
          {/* Screen — natural page scroll keeps anchor + fixed-nav behavior */}
          <div className="flex min-h-[70dvh] flex-1 flex-col">{children}</div>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none hidden w-56 shrink-0 select-none self-center pl-8 lg:block xl:w-72"
      >
        <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
          <li className="rounded-2xl border border-slate-200/70 bg-white/70 p-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
            <span className="font-bold text-slate-900 dark:text-slate-100">911 first.</span>
            <br />
            Banner sits below the hero fold.
          </li>
          <li className="rounded-2xl border border-slate-200/70 bg-white/70 p-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
            <span className="font-bold text-slate-900 dark:text-slate-100">Thumb zone.</span>
            <br />
            Four-tab bar within easy reach.
          </li>
        </ul>
      </div>
    </div>
  );
}
