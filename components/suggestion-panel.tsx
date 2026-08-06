"use client";

import { useState } from "react";
import { CheckIcon, SendIcon } from "@/components/icons";

export function SuggestionPanel() {
  const [message, setMessage] = useState("");
  const [office, setOffice] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!message.trim()) {
      setError("Please write a suggestion.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, office }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Couldn't send your suggestion.");
        return;
      }
      setSent(true);
    } catch {
      setError("Couldn't send your suggestion. Check your connection.");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
          <CheckIcon className="h-7 w-7" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Thanks for your suggestion!
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            It&apos;s been sent to the admins.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setSent(false);
            setMessage("");
            setOffice("");
          }}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label
          htmlFor="suggestion-message"
          className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400"
        >
          Your suggestion
        </label>
        <textarea
          id="suggestion-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="Tell us how we can improve…"
          className="w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-500/15 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
      </div>
      <div>
        <label
          htmlFor="suggestion-office"
          className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400"
        >
          Office / unit (optional)
        </label>
        <input
          id="suggestion-office"
          value={office}
          onChange={(e) => setOffice(e.target.value)}
          maxLength={100}
          placeholder="e.g. Fire Station"
          className="w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-500/15 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
      </div>
      {error && (
        <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={sending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-rose-600 to-red-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-rose-600/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <SendIcon className="h-4 w-4" />
        {sending ? "Sending…" : "Send suggestion"}
      </button>
    </form>
  );
}
