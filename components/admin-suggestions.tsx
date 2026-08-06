"use client";

import { useState } from "react";
import { MessageSquareIcon, TrashIcon } from "@/components/icons";

export type SuggestionItem = {
  id: string;
  message: string;
  office: string | null;
  createdAt: string;
};

type Props = {
  initialItems: SuggestionItem[];
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function AdminSuggestions({ initialItems }: Props) {
  const [items, setItems] = useState<SuggestionItem[]>(initialItems);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this suggestion?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/suggestions/${id}`, { method: "DELETE" });
      if (res.ok) {
        setItems((prev) => prev.filter((s) => s.id !== id));
      }
    } catch {
      // ignore
    } finally {
      setDeleting(null);
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto mt-6 w-full max-w-2xl rounded-2xl border border-dashed border-slate-300 bg-white/70 p-10 text-center dark:border-slate-700 dark:bg-slate-900/70">
        <p className="text-slate-500 dark:text-slate-400">
          No suggestions yet.
        </p>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          Suggestions sent from the floating widget will show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-6 w-full max-w-2xl space-y-3">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {items.length} suggestion{items.length === 1 ? "" : "s"}
      </p>
      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  <MessageSquareIcon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {item.office || "Anonymous"}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {formatDate(item.createdAt)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                disabled={deleting === item.id}
                aria-label="Delete suggestion"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 dark:hover:bg-rose-500/15 dark:hover:text-rose-400"
              >
                <TrashIcon className="h-4.5 w-4.5" />
              </button>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {item.message}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
