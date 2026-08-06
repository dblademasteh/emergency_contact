"use client";

import { useRef, useState } from "react";
import {
  ACCEPTED_LOGO_TYPES,
  MAX_BANNER_DIMENSION,
  MAX_BANNER_SOURCE_SIZE,
  readImageAsDataUrl,
} from "@/lib/client-image";
import { ImageIcon, PlusIcon, XIcon } from "@/components/icons";

export type HomeContentLink = { label: string; href: string };

type HomeImageProps = {
  image: string | null;
  isAdmin: boolean;
  onChanged: (image: string | null) => void;
  endpoint?: string;
  placeholder?: string;
  alt?: string;
  links?: HomeContentLink[];
  onLinksChanged?: (links: HomeContentLink[]) => void;
  linksEndpoint?: string;
};

export function HomeImage({
  image,
  isAdmin,
  onChanged,
  endpoint = "/api/settings/home-image",
  placeholder = "Add a home photo",
  alt = "Home banner",
  links,
  onLinksChanged,
  linksEndpoint = "/api/settings/home-content-links",
}: HomeImageProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingLinks, setEditingLinks] = useState(false);
  const [linkDrafts, setLinkDrafts] = useState<HomeContentLink[]>([
    { label: "", href: "" },
    { label: "", href: "" },
  ]);
  const [linksBusy, setLinksBusy] = useState(false);
  const [linksError, setLinksError] = useState<string | null>(null);

  const linksEnabled = typeof onLinksChanged === "function";

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!ACCEPTED_LOGO_TYPES.includes(file.type)) {
      setError("Please choose a PNG, JPEG, WebP, or GIF image.");
      return;
    }
    if (file.size > MAX_BANNER_SOURCE_SIZE) {
      setError("Image must be 20 MB or smaller.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const dataUrl = await readImageAsDataUrl(file, MAX_BANNER_DIMENSION);
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
      onChanged(data?.image ?? null);
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
      onChanged(null);
    } catch {
      setError("Couldn't remove the image.");
    } finally {
      setBusy(false);
    }
  }

  function startEditLinks() {
    const existing = links ?? [];
    setLinkDrafts([
      existing[0] ?? { label: "", href: "" },
      existing[1] ?? { label: "", href: "" },
    ]);
    setLinksError(null);
    setEditingLinks(true);
  }

  function updateDraft(
    index: number,
    field: "label" | "href",
    value: string
  ) {
    setLinkDrafts((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: value } : d))
    );
  }

  async function saveLinks() {
    const cleaned = linkDrafts
      .map((l) => ({ label: l.label.trim(), href: l.href.trim() }))
      .filter((l) => l.label && l.href);
    setLinksBusy(true);
    setLinksError(null);
    try {
      const res = await fetch(linksEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ links: cleaned }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setLinksError(data?.error ?? "Couldn't save the links.");
        return;
      }
      onLinksChanged?.(data?.links ?? []);
      setEditingLinks(false);
    } catch {
      setLinksError("Couldn't save the links. Check your connection.");
    } finally {
      setLinksBusy(false);
    }
  }

  if (!image && !isAdmin && !(links && links.length > 0)) return null;

  return (
    <div className="mb-4">
      {!editingLinks && links && links.length > 0 && (
        <div className="mb-2 grid grid-cols-2 gap-2">
          {links.map((l, i) => (
            <a
              key={i}
              href={l.href}
              className="truncate rounded-xl bg-linear-to-r from-rose-600 to-red-600 px-3 py-2.5 text-center text-sm font-bold text-white shadow-md shadow-rose-600/20 transition hover:brightness-110"
            >
              {l.label}
            </a>
          ))}
        </div>
      )}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900">
      {editingLinks ? (
        <div className="flex flex-col gap-2.5 p-3">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Quick links on this image
          </p>
          {linkDrafts.map((draft, i) => (
            <div key={i} className="grid grid-cols-2 gap-2">
              <input
                value={draft.label}
                onChange={(e) => updateDraft(i, "label", e.target.value)}
                placeholder={`Link ${i + 1} label`}
                maxLength={40}
                aria-label={`Link ${i + 1} label`}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-500"
              />
              <input
                value={draft.href}
                onChange={(e) => updateDraft(i, "href", e.target.value)}
                placeholder={`Link ${i + 1} URL`}
                maxLength={500}
                aria-label={`Link ${i + 1} URL`}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-500"
              />
            </div>
          ))}
          {linksError && (
            <p className="text-xs font-medium text-red-600">{linksError}</p>
          )}
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditingLinks(false)}
              disabled={linksBusy}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveLinks}
              disabled={linksBusy}
              className="rounded-full bg-linear-to-r from-rose-600 to-red-600 px-4 py-2 text-sm font-bold text-white shadow-md shadow-rose-600/25 transition hover:brightness-110 disabled:opacity-60"
            >
              {linksBusy ? "Saving…" : "Save links"}
            </button>
          </div>
        </div>
      ) : (
        <>
          {image ? (
            <img src={image} alt={alt} className="w-full h-auto" />
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="flex h-40 w-full flex-col items-center justify-center gap-2 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800/60 dark:hover:text-slate-300"
            >
              <ImageIcon className="h-8 w-8" />
              <span className="text-sm font-medium">
                {busy ? "Uploading…" : placeholder}
              </span>
            </button>
          )}
          {isAdmin && image && (
            <div className="absolute right-2 top-2 flex gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur transition hover:bg-black/70 disabled:opacity-60"
              >
                <ImageIcon className="h-3.5 w-3.5" />
                {busy ? "Saving…" : "Change"}
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={busy}
                aria-label="Remove home photo"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-black/70 disabled:opacity-60"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
          )}
          {linksEnabled && isAdmin && (
            <button
              type="button"
              onClick={startEditLinks}
              className="absolute left-2 top-2 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur transition hover:bg-black/70"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              {links && links.length > 0 ? "Edit links" : "Add links"}
            </button>
          )}
        </>
      )}
      <input
        ref={fileRef}
        type="file"
        accept={ACCEPTED_LOGO_TYPES.join(",")}
        onChange={handleFile}
        className="hidden"
      />
      {error && !editingLinks && (
        <p className="absolute bottom-2 left-2 right-2 z-20 rounded-lg bg-red-600/90 px-3 py-1.5 text-xs font-medium text-white">
          {error}
        </p>
      )}
      </div>
    </div>
  );
}
