"use client";

import { useEffect, useState } from "react";
import { ImageIcon, XIcon, GlobeIcon, ShieldIcon, TrashIcon, EditIcon } from "@/components/icons";

/* ── helpers ── */

function normalizeFacebookUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^https?:\/\/(www\.)?facebook\.com\//i.test(trimmed)) return trimmed;
  if (/^[a-zA-Z0-9.]+$/.test(trimmed))
    return `https://www.facebook.com/${trimmed}`;
  if (/^facebook\.com\//i.test(trimmed))
    return `https://www.${trimmed}`;
  return null;
}

function embedUrl(pageUrl: string): string {
  return `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(pageUrl)}&tabs=timeline&width=500&height=700&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true`;
}

function normalizeSiteUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function youtubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return m?.[1] ?? null;
}

function youtubeThumb(url: string): string | null {
  const id = youtubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

/* ── types ── */

type Tab = "bfp-site" | "bfp-fb" | "bfp-corner";

type CornerEntry = {
  id: string;
  title: string;
  youtubeUrl: string;
  sortOrder: number;
};

type Props = {
  pageUrl: string | null;
  bfpSiteUrl: string | null;
  isAdmin: boolean;
  onChanged: (url: string | null) => void;
  onBfpChanged: (url: string | null) => void;
};

export function FacebookFeed({
  pageUrl,
  bfpSiteUrl,
  isAdmin,
  onChanged,
  onBfpChanged,
}: Props) {
  const [tab, setTab] = useState<Tab>("bfp-fb");
  const [editingSite, setEditingSite] = useState(false);
  const [editingFb, setEditingFb] = useState(false);
  const [draftSite, setDraftSite] = useState(bfpSiteUrl ?? "");
  const [draftFb, setDraftFb] = useState(pageUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ── BFP Corner state ── */
  const [cornerEntries, setCornerEntries] = useState<CornerEntry[]>([]);
  const [cornerLoading, setCornerLoading] = useState(false);
  const [cornerTitle, setCornerTitle] = useState("");
  const [cornerUrl, setCornerUrl] = useState("");
  const [cornerEditId, setCornerEditId] = useState<string | null>(null);
  const [cornerBusy, setCornerBusy] = useState(false);
  const [cornerError, setCornerError] = useState<string | null>(null);

  async function loadCornerEntries() {
    setCornerLoading(true);
    try {
      const res = await fetch("/api/bfp-corner");
      if (res.ok) setCornerEntries(await res.json());
    } finally {
      setCornerLoading(false);
    }
  }

  useEffect(() => {
    if (tab === "bfp-corner") loadCornerEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  /* ── save handlers (site / fb) ── */

  async function saveSite(url: string | null) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/settings/bfp-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) { setError(data?.error ?? "Couldn't save."); return; }
      onBfpChanged(data?.url ?? null);
      setEditingSite(false);
    } catch { setError("Couldn't save. Check your connection."); }
    finally { setBusy(false); }
  }

  async function saveFb(url: string | null) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/settings/facebook-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) { setError(data?.error ?? "Couldn't save."); return; }
      onChanged(data?.url ?? null);
      setEditingFb(false);
    } catch { setError("Couldn't save. Check your connection."); }
    finally { setBusy(false); }
  }

  function handleSaveSite() {
    const n = normalizeSiteUrl(draftSite);
    if (draftSite.trim() && !n) { setError("Enter a valid URL."); return; }
    saveSite(n);
  }

  function handleSaveFb() {
    const n = normalizeFacebookUrl(draftFb);
    if (draftFb.trim() && !n) { setError("Enter a Facebook page URL (e.g. facebook.com/yourpage)"); return; }
    saveFb(n);
  }

  /* ── BFP Corner CRUD ── */

  async function saveCornerEntry() {
    const t = cornerTitle.trim();
    const u = cornerUrl.trim();
    if (!t) { setCornerError("Title is required."); return; }
    if (!u) { setCornerError("YouTube URL is required."); return; }
    if (!youtubeId(u)) { setCornerError("Enter a valid YouTube URL."); return; }

    setCornerBusy(true);
    setCornerError(null);
    try {
      const method = cornerEditId ? "PATCH" : "POST";
      const path = cornerEditId
        ? `/api/bfp-corner/${cornerEditId}`
        : "/api/bfp-corner";
      const res = await fetch(path, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: t, youtubeUrl: u }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setCornerError(data?.error ?? "Couldn't save.");
        return;
      }
      setCornerTitle("");
      setCornerUrl("");
      setCornerEditId(null);
      await loadCornerEntries();
    } catch {
      setCornerError("Couldn't save. Check your connection.");
    } finally {
      setCornerBusy(false);
    }
  }

  async function deleteCornerEntry(id: string) {
    const res = await fetch(`/api/bfp-corner/${id}`, { method: "DELETE" });
    if (res.ok) await loadCornerEntries();
  }

  function startEditCorner(e: CornerEntry) {
    setCornerEditId(e.id);
    setCornerTitle(e.title);
    setCornerUrl(e.youtubeUrl);
    setCornerError(null);
  }

  function cancelCornerEdit() {
    setCornerEditId(null);
    setCornerTitle("");
    setCornerUrl("");
    setCornerError(null);
  }

  /* ── visibility ── */

  const hasContent = bfpSiteUrl || pageUrl || cornerEntries.length > 0;
  if (!hasContent && !isAdmin) return null;

  /* ── render ── */

  const tabBtn = (id: Tab, icon: React.ReactNode, label: string) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
        tab === id
          ? "bg-slate-900 text-white shadow-md dark:bg-slate-100 dark:text-slate-900"
          : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="mb-4">
      {/* ── Tab buttons ── */}
      <div className="mb-3 flex gap-2">
        {tabBtn("bfp-fb", <ImageIcon className="h-4 w-4" />, "BFP Facebook")}
        {tabBtn("bfp-site", <GlobeIcon className="h-4 w-4" />, "BFP Site")}
        {tabBtn("bfp-corner", <ShieldIcon className="h-4 w-4" />, "BFP Corner")}
      </div>

      {/* ── Content area ── */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900">

        {/* ── BFP Site tab ── */}
        {tab === "bfp-site" && (
          <>
            {editingSite ? (
              <div className="p-4">
                <p className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">BFP website URL</p>
                <input
                  value={draftSite}
                  onChange={(e) => { setDraftSite(e.target.value); setError(null); }}
                  placeholder="https://bfp.gov.ph"
                  className="mb-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-500"
                />
                {error && <p className="mb-2 text-xs font-medium text-red-600">{error}</p>}
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => { setEditingSite(false); setDraftSite(bfpSiteUrl ?? ""); setError(null); }} disabled={busy} className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">Cancel</button>
                  <button type="button" onClick={handleSaveSite} disabled={busy} className="rounded-full bg-linear-to-r from-rose-600 to-red-600 px-4 py-2 text-sm font-bold text-white shadow-md shadow-rose-600/25 transition hover:brightness-110 disabled:opacity-60">{busy ? "Saving…" : "Save"}</button>
                </div>
              </div>
            ) : bfpSiteUrl ? (
              <a
                href={bfpSiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-[700px] w-full flex-col items-center justify-center gap-4 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200"
              >
                <GlobeIcon className="h-12 w-12" />
                <span className="text-sm font-semibold">{bfpSiteUrl}</span>
                <span className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">Open site</span>
              </a>
            ) : (
              <button type="button" onClick={() => setEditingSite(true)} className="flex h-32 w-full flex-col items-center justify-center gap-2 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800/60 dark:hover:text-slate-300">
                <GlobeIcon className="h-8 w-8" />
                <span className="text-sm font-medium">Add BFP website</span>
              </button>
            )}
          </>
        )}

        {/* ── BFP Facebook tab ── */}
        {tab === "bfp-fb" && (
          <>
            {editingFb ? (
              <div className="p-4">
                <p className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">Facebook page</p>
                <input
                  value={draftFb}
                  onChange={(e) => { setDraftFb(e.target.value); setError(null); }}
                  placeholder="facebook.com/yourpage"
                  className="mb-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-500"
                />
                {error && <p className="mb-2 text-xs font-medium text-red-600">{error}</p>}
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => { setEditingFb(false); setDraftFb(pageUrl ?? ""); setError(null); }} disabled={busy} className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">Cancel</button>
                  <button type="button" onClick={handleSaveFb} disabled={busy} className="rounded-full bg-linear-to-r from-rose-600 to-red-600 px-4 py-2 text-sm font-bold text-white shadow-md shadow-rose-600/25 transition hover:brightness-110 disabled:opacity-60">{busy ? "Saving…" : "Save"}</button>
                </div>
              </div>
            ) : pageUrl ? (
              <div className="mx-auto w-full max-w-[540px]">
                <iframe
                  key={pageUrl}
                  src={embedUrl(pageUrl)}
                  style={{ border: "none", overflow: "hidden" }}
                  scrolling="no"
                  frameBorder="0"
                  title="Facebook Feed"
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                  className="h-[700px] w-full"
                />
              </div>
            ) : (
              <button type="button" onClick={() => setEditingFb(true)} className="flex h-32 w-full flex-col items-center justify-center gap-2 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800/60 dark:hover:text-slate-300">
                <ImageIcon className="h-8 w-8" />
                <span className="text-sm font-medium">Add Facebook page feed</span>
              </button>
            )}
          </>
        )}

        {/* ── BFP Corner tab ── */}
        {tab === "bfp-corner" && (
          <div className="p-4">
            {/* Admin add / edit form */}
            {isAdmin && (
              <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                <p className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {cornerEditId ? "Edit entry" : "Add entry"}
                </p>
                <input
                  value={cornerTitle}
                  onChange={(e) => { setCornerTitle(e.target.value); setCornerError(null); }}
                  placeholder="Title"
                  className="mb-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-500"
                />
                <input
                  value={cornerUrl}
                  onChange={(e) => { setCornerUrl(e.target.value); setCornerError(null); }}
                  placeholder="https://youtube.com/watch?v=..."
                  className="mb-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-500"
                />
                {cornerUrl.trim() && youtubeThumb(cornerUrl) && (
                  <img
                    src={youtubeThumb(cornerUrl)!}
                    alt="Preview"
                    className="mb-2 h-24 rounded-lg object-cover"
                  />
                )}
                {cornerError && <p className="mb-2 text-xs font-medium text-red-600">{cornerError}</p>}
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={cancelCornerEdit} disabled={cornerBusy} className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">Cancel</button>
                  <button type="button" onClick={saveCornerEntry} disabled={cornerBusy} className="rounded-full bg-linear-to-r from-rose-600 to-red-600 px-4 py-2 text-sm font-bold text-white shadow-md shadow-rose-600/25 transition hover:brightness-110 disabled:opacity-60">
                    {cornerBusy ? "Saving…" : cornerEditId ? "Update" : "Add"}
                  </button>
                </div>
              </div>
            )}

            {/* Entry list */}
            {cornerLoading ? (
              <p className="py-8 text-center text-sm text-slate-400">Loading…</p>
            ) : cornerEntries.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No entries yet.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {cornerEntries.map((entry) => {
                  const thumb = youtubeThumb(entry.youtubeUrl);
                  return (
                    <div
                      key={entry.id}
                      className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
                    >
                      {thumb ? (
                        <a href={entry.youtubeUrl} target="_blank" rel="noopener noreferrer">
                          <img src={thumb} alt={entry.title} className="h-40 w-full object-cover" />
                        </a>
                      ) : (
                        <div className="flex h-40 w-full items-center justify-center bg-slate-100 dark:bg-slate-700">
                          <ImageIcon className="h-10 w-10 text-slate-400" />
                        </div>
                      )}
                      <div className="p-3">
                        <a
                          href={entry.youtubeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-slate-900 hover:underline dark:text-slate-100"
                        >
                          {entry.title}
                        </a>
                      </div>
                      {isAdmin && (
                        <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => startEditCorner(entry)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-black/70"
                            aria-label="Edit"
                          >
                            <EditIcon className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteCornerEntry(entry.id)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-red-600/80"
                            aria-label="Delete"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Admin overlay buttons (site / fb only) ── */}
        {isAdmin && tab !== "bfp-corner" && (
          <div className="absolute right-2 top-2 flex gap-2">
            {tab === "bfp-site" && !editingSite && (
              <>
                <button type="button" onClick={() => { setDraftSite(bfpSiteUrl ?? ""); setEditingSite(true); }} className="inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur transition hover:bg-black/70">
                  <GlobeIcon className="h-3.5 w-3.5" />{bfpSiteUrl ? "Change" : "Add site"}
                </button>
                {bfpSiteUrl && (
                  <button type="button" onClick={() => saveSite(null)} aria-label="Remove BFP site" className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-black/70">
                    <XIcon className="h-4 w-4" />
                  </button>
                )}
              </>
            )}
            {tab === "bfp-fb" && !editingFb && (
              <>
                <button type="button" onClick={() => { setDraftFb(pageUrl ?? ""); setEditingFb(true); }} className="inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur transition hover:bg-black/70">
                  <ImageIcon className="h-3.5 w-3.5" />{pageUrl ? "Change" : "Add feed"}
                </button>
                {pageUrl && (
                  <button type="button" onClick={() => saveFb(null)} aria-label="Remove Facebook feed" className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-black/70">
                    <XIcon className="h-4 w-4" />
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
