"use client";

import { useEffect, useState } from "react";
import { FaqPanel } from "@/components/faq-panel";
import { SuggestionPanel } from "@/components/suggestion-panel";
import { HelpIcon, MessageSquareIcon, SendIcon, XIcon } from "@/components/icons";

type Props = {
  isAdmin: boolean;
};

export function HelpWidget({ isAdmin }: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"faq" | "suggestion">("faq");

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Help and suggestions"
        className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-br from-rose-500 to-red-600 text-white shadow-lg shadow-rose-600/30 transition hover:brightness-110 active:scale-95"
      >
        <HelpIcon className="h-6 w-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close help"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          />
          <div className="relative z-10 flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <h2 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                Help &amp; suggestions
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div
              role="tablist"
              aria-label="Help widget"
              className="grid grid-cols-2 gap-1 p-2"
            >
              <button
                type="button"
                role="tab"
                aria-selected={tab === "faq"}
                onClick={() => setTab("faq")}
                className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  tab === "faq"
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                <MessageSquareIcon className="h-4 w-4" />
                FAQ
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "suggestion"}
                onClick={() => setTab("suggestion")}
                className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  tab === "suggestion"
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                <SendIcon className="h-4 w-4" />
                Suggestion
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {tab === "faq" ? (
                <FaqPanel isAdmin={isAdmin} />
              ) : (
                <SuggestionPanel />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
