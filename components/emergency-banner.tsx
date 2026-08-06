"use client";

import { PhoneIcon } from "@/components/icons";

export function EmergencyBanner() {
  return (
    <a
      href="tel:911"
      aria-label="Call 911 for emergency"
      className="mb-6 block overflow-hidden rounded-3xl bg-gradient-to-br from-rose-600 via-red-600 to-red-700 p-6 text-white shadow-lg shadow-red-900/20 transition hover:shadow-xl hover:shadow-red-900/30"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
            </span>
            Primary emergency line
          </span>
          <p className="mt-4 text-5xl font-black leading-none tracking-tight sm:text-6xl">
            911
          </p>
          <p className="mt-2 text-sm font-medium text-red-100">
            Police · Fire · Medical — available 24/7
          </p>
        </div>
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
          <PhoneIcon className="h-7 w-7" />
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/20">
        <span className="text-sm font-semibold">Tap to call</span>
        <span className="text-sm font-bold">911</span>
      </div>
    </a>
  );
}
