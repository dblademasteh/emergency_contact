"use client";

import { useRef, useState } from "react";
import {
  ACCEPTED_LOGO_TYPES,
  MAX_LOGO_SOURCE_SIZE,
  readImageAsDataUrl,
} from "@/lib/client-image";
import { ImageIcon } from "@/components/icons";

type LogoManagerProps = {
  logo: string | null;
  isAdmin: boolean;
  onChanged: (logo: string | null) => void;
};

export function LogoManager({ logo, isAdmin, onChanged }: LogoManagerProps) {
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
      const res = await fetch("/api/settings/app-logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logo: dataUrl }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Couldn't save the logo.");
        return;
      }
      onChanged(data?.logo ?? null);
    } catch {
      setError("Couldn't read that image. Try another file.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/settings/app-logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logo: null }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Couldn't remove the logo.");
        return;
      }
      onChanged(null);
    } catch {
      setError("Couldn't remove the logo.");
    } finally {
      setBusy(false);
    }
  }

  if (!isAdmin) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/70">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-linear-to-br from-rose-500 via-red-600 to-red-800 text-white shadow-md shadow-red-600/30">
        {logo ? (
          <img
            src={logo}
            alt="App logo"
            className="h-full w-full object-cover"
          />
        ) : (
          <ImageIcon className="h-5 w-5" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          App logo
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Used in the header, sign-in page, and as the app icon &amp; splash.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          {logo ? "Change" : "Upload"}
        </button>
        {logo && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={busy}
            className="rounded-full px-3 py-1.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50 hover:text-rose-700 disabled:opacity-60 dark:hover:bg-rose-500/15 dark:hover:text-rose-400"
          >
            Remove
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED_LOGO_TYPES.join(",")}
          onChange={handleFile}
          className="hidden"
        />
      </div>
      {error && (
        <p className="w-full text-xs font-medium text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
}
