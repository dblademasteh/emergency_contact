"use client";

import { PhoneIcon } from "@/components/icons";

export function EmergencyBanner() {
  return (
    <a
      href="tel:911"
      aria-label="Call 911 for emergency"
      className="group relative mb-6 block overflow-hidden rounded-2xl bg-linear-to-br from-rose-600 via-red-600 to-red-800 px-5 py-4 text-white shadow-lg shadow-red-900/25 transition hover:shadow-xl hover:shadow-red-900/35"
    >
      {/* Hazard stripe edge */}
      <span
        aria-hidden="true"
        className="hazard-stripes pointer-events-none absolute inset-x-0 bottom-0 h-1.5"
      />

      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-3xl font-black leading-none tracking-tighter drop-shadow-sm">
            911
          </p>
          <p className="mt-1 text-xs font-semibold text-red-100">
            Police · Fire · Medical — 24/7
          </p>
        </div>
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
          <PhoneIcon className="h-5 w-5" />
        </div>
      </div>

      <div className="relative mt-3 flex items-center justify-between rounded-xl bg-black/25 px-3 py-2 ring-1 ring-white/20 transition group-hover:bg-black/35">
        <span className="text-xs font-bold">Tap to call</span>
        <span className="flex items-center gap-1 text-xs font-black">
          <PhoneIcon className="h-3 w-3" />
          911
        </span>
      </div>
    </a>
  );
}
