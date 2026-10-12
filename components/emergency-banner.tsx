"use client";

import { useRef, useState } from "react";
import {
  ACCEPTED_LOGO_TYPES,
  MAX_LOGO_SOURCE_SIZE,
  readImageAsDataUrl,
} from "@/lib/client-image";
import { ImageIcon, PhoneIcon } from "@/components/icons";

type Props = {
  image?: string | null;
  isAdmin?: boolean;
  onChanged?: (image: string | null) => void;
  endpoint?: string;
};

export function EmergencyBanner({
  image = null,
  isAdmin = false,
  onChanged,
  endpoint = "/api/settings/banner-image",
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!ACCEPTED_LOGO_TYPES.includes(file.type)) {
      setError("Please choose a PNG, JPEG, WebP, or GIF image.");
      return;
    }
    if (file.size > MAX_LOGO_SOURCE_SIZE) {
      setError("Image must be 20 MB or smaller.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const dataUrl = await readImageAsDataUrl(file, 512);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Couldn't save the image.");
        return;
      }
      onChanged?.(data?.image ?? null);
    } catch {
      setError("Couldn't read that image. Try another file.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: null }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Couldn't remove the image.");
        return;
      }
      onChanged?.(null);
    } catch {
      setError("Couldn't remove the image.");
    } finally {
      setBusy(false);
    }
  }

  function openPicker(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    fileRef.current?.click();
  }

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

      <div className="flex items-center gap-3">
        {/* Image container — admin-uploadable 911 artwork */}
        {image ? (
          <span className="relative block h-[72px] w-fit max-w-[168px] shrink-0 overflow-hidden rounded-xl bg-white/10 ring-1 ring-white/25">
            <img
              src={image}
              alt="911"
              className="h-full w-auto max-w-full object-contain"
            />
            {isAdmin && (
              <span className="absolute inset-x-1 bottom-1 flex gap-1">
                <button
                  type="button"
                  onClick={openPicker}
                  disabled={busy}
                  className="flex-1 rounded-lg bg-black/55 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur transition hover:bg-black/70 disabled:opacity-60"
                >
                  {busy ? "Saving…" : "Change"}
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={busy}
                  aria-label="Remove banner image"
                  className="rounded-lg bg-black/55 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur transition hover:bg-black/70 disabled:opacity-60"
                >
                  ✕
                </button>
              </span>
            )}
          </span>
        ) : (
          isAdmin && (
            <button
              type="button"
              onClick={openPicker}
              disabled={busy}
              className="flex h-[72px] w-[104px] shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-white/40 bg-white/10 text-red-100 transition hover:bg-white/20 disabled:opacity-60"
            >
              <ImageIcon className="h-5 w-5" />
              <span className="px-1 text-center text-[11px] font-semibold leading-tight">
                {busy ? "Uploading…" : "Add image"}
              </span>
            </button>
          )
        )}

        <div className="min-w-0 flex-1">
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

      <input
        ref={fileRef}
        type="file"
        accept={ACCEPTED_LOGO_TYPES.join(",")}
        onChange={handleFile}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />
      {error && (
        <p
          className="relative mt-2 rounded-lg bg-black/40 px-3 py-1.5 text-xs font-medium text-white"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {error}
        </p>
      )}
    </a>
  );
}
