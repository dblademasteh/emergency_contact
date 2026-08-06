"use client";

import { useEffect, useState } from "react";
import {
  ChevronDownIcon,
  EditIcon,
  PlusIcon,
  TrashIcon,
} from "@/components/icons";

type FaqItem = {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
};

type Props = {
  isAdmin: boolean;
};

export function FaqPanel({ isAdmin }: Props) {
  const [items, setItems] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<FaqItem | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/faq");
      const data = await res.json();
      if (!res.ok) throw new Error();
      setItems(Array.isArray(data) ? data : (data?.items ?? []));
    } catch {
      setLoadError("Couldn't load the FAQ.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startAdd() {
    setAdding(true);
    setEditing(null);
    setQuestion("");
    setAnswer("");
    setFormError(null);
  }

  function startEdit(item: FaqItem) {
    setAdding(false);
    setEditing(item);
    setQuestion(item.question);
    setAnswer(item.answer);
    setFormError(null);
  }

  function cancelForm() {
    setAdding(false);
    setEditing(null);
    setFormError(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const res = await fetch(
        editing ? `/api/faq/${editing.id}` : "/api/faq",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question, answer }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setFormError(data?.error ?? "Couldn't save this entry.");
        return;
      }
      cancelForm();
      await load();
    } catch {
      setFormError("Couldn't save this entry.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this FAQ entry?")) return;
    try {
      const res = await fetch(`/api/faq/${id}`, { method: "DELETE" });
      if (res.ok) await load();
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-3">
      {isAdmin && (
        <button
          type="button"
          onClick={startAdd}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-rose-300 bg-rose-50/60 px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20"
        >
          <PlusIcon className="h-4 w-4" />
          Add a question
        </button>
      )}

      {(adding || editing) && (
        <form
          onSubmit={handleSave}
          className="space-y-3 rounded-2xl border border-rose-200 bg-rose-50/60 p-3.5 dark:border-rose-500/30 dark:bg-rose-500/10"
        >
          <div>
            <label
              htmlFor="faq-question"
              className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400"
            >
              Question
            </label>
            <input
              id="faq-question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={200}
              placeholder="e.g. How do I add a contact?"
              autoFocus
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-500/15 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>
          <div>
            <label
              htmlFor="faq-answer"
              className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400"
            >
              Answer
            </label>
            <textarea
              id="faq-answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              maxLength={5000}
              rows={3}
              placeholder="Write the answer…"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-500/15 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>
          {formError && (
            <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
              {formError}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={cancelForm}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !question.trim() || !answer.trim()}
              className="rounded-xl bg-linear-to-r from-rose-600 to-red-600 px-4 py-2 text-sm font-bold text-white shadow-sm shadow-rose-600/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
            />
          ))}
        </div>
      ) : loadError ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          {loadError}
        </p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-center dark:border-slate-700 dark:bg-slate-900/70">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No questions yet.
          </p>
          {isAdmin && (
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              Add a question to get started.
            </p>
          )}
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const isOpen = expanded === item.id;
            return (
              <li
                key={item.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-center gap-1 pr-1.5">
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : item.id)}
                    className="flex flex-1 items-center justify-between gap-2 px-3.5 py-3 text-left"
                  >
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {item.question}
                    </span>
                    <ChevronDownIcon
                      className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isAdmin && (
                    <div className="flex shrink-0 items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        aria-label={`Edit ${item.question}`}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                      >
                        <EditIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        aria-label={`Delete ${item.question}`}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/15 dark:hover:text-rose-400"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
                {isOpen && (
                  <div className="border-t border-slate-100 px-3.5 py-3 dark:border-slate-800">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      {item.answer}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
