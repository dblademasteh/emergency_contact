"use client";

import { useState } from "react";
import { CheckIcon, EditIcon, XIcon } from "@/components/icons";

type AppNameManagerProps = {
  name: string;
  isAdmin: boolean;
  onChanged: (name: string) => void;
};

export function AppNameManager({ name, isAdmin, onChanged }: AppNameManagerProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isAdmin) return null;

  async function handleSave() {
    const trimmed = value.trim();
    if (!trimmed) {
      setError("App name cannot be empty.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/settings/app-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Couldn't save the app name.");
        return;
      }
      onChanged(data?.name ?? trimmed);
      setEditing(false);
    } catch {
      setError("Couldn't save the app name.");
    } finally {
      setBusy(false);
    }
  }

  function handleCancel() {
    setValue(name);
    setError(null);
    setEditing(false);
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/70">
      <div className="min-w-0 flex-1">
        {editing ? (
          <div className="flex flex-col gap-2">
            <label
              htmlFor="app-name-input"
              className="text-sm font-semibold text-slate-900 dark:text-slate-100"
            >
              App name
            </label>
            <input
              id="app-name-input"
              type="text"
              value={value}
              maxLength={60}
              onChange={(e) => {
                setValue(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") handleCancel();
              }}
              placeholder="Beep Me App V2.0"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-rose-500 dark:focus:ring-rose-500/20"
            />
            {error && (
              <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
                {error}
              </p>
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-full bg-linear-to-r from-rose-600 to-red-600 px-3.5 py-1.5 text-sm font-semibold text-white shadow-md shadow-rose-600/25 transition hover:brightness-110 disabled:opacity-60"
              >
                <CheckIcon className="h-4 w-4" />
                {busy ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <XIcon className="h-4 w-4" />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                App name
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {name || "Beep Me App V2.0"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setValue(name);
                setEditing(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <EditIcon className="h-4 w-4" />
              Edit
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
