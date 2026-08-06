"use client";

import { PhoneIcon } from "@/components/icons";

export function EmergencyBanner() {
  return (
    <a
      href="tel:911"
      aria-label="Call 911 for emergency"
      className="group relative mb-6 block overflow-hidden rounded-[1.75rem] bg-linear-to-br from-rose-600 via-red-600 to-red-800 p-6 text-white shadow-xl shadow-red-900/30 transition hover:shadow-2xl hover:shadow-red-900/40"
    >
      {/* Beacon rings */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10"
      />
      <span
        aria-hidden="true"
        className="animate-beacon pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/20"
      />
      {/* Hazard stripe edge */}
      <span
        aria-hidden="true"
        className="hazard-stripes pointer-events-none absolute inset-x-0 bottom-0 h-2.5"
      />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-widest ring-1 ring-white/25">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
            </span>
            Primary emergency line
          </span>
          <p className="mt-4 text-6xl font-black leading-none tracking-tighter drop-shadow-sm sm:text-7xl">
            911
          </p>
          <p className="mt-2 text-sm font-semibold text-red-100">
            Police · Fire · Medical — available 24/7
          </p>
        </div>
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
          <PhoneIcon className="h-8 w-8" />
        </div>
      </div>

      <div className="relative mt-5 flex items-center justify-between rounded-2xl bg-black/25 px-4 py-3 ring-1 ring-white/20 transition group-hover:bg-black/35">
        <span className="text-sm font-bold">Tap to call</span>
        <span className="flex items-center gap-1.5 text-sm font-black">
          <PhoneIcon className="h-4 w-4" />
          911
        </span>
      </div>
    </a>
  );
}
