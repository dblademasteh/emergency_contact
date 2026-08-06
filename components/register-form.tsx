"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RegisterForm() {
  const router = useRouter();
  const [office, setOffice] = useState("");
  const [unitCode, setUnitCode] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ office, unitCode, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't create the account.");
        setSubmitting(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Network error. Check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="office"
          className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Office
        </label>
        <input
          id="office"
          type="text"
          value={office}
          onChange={(e) => setOffice(e.target.value)}
          autoComplete="organization"
          autoFocus
          placeholder="e.g. Fire Station"
          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-500"
        />
      </div>

      <div>
        <label
          htmlFor="unitCode"
          className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Unit code
        </label>
        <input
          id="unitCode"
          type="text"
          value={unitCode}
          onChange={(e) => setUnitCode(e.target.value)}
          autoComplete="off"
          placeholder="e.g. 20000"
          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-500"
        />
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          A unique code for your station or unit — you'll use it to sign in.
        </p>
      </div>

      <div>
        <label
          htmlFor="registerPassword"
          className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Password
        </label>
        <input
          id="registerPassword"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-500"
        />
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          At least 6 characters.
        </p>
      </div>

      {error && (
        <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-linear-to-r from-rose-600 to-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-rose-600/25 transition hover:brightness-110 disabled:opacity-60"
      >
        {submitting ? "Creating account…" : "Create account"}
      </button>

      <p className="text-center text-xs text-slate-500 dark:text-slate-400">
        Creating an account lets you manage groups and contacts.
      </p>
    </form>
  );
}
