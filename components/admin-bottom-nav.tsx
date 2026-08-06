"use client";

import {
  FolderIcon,
  LogOutIcon,
  MessageSquareIcon,
  PillIcon,
  PlusIcon,
} from "@/components/icons";

type Props = {
  isAdmin: boolean;
  onAddContact: () => void;
  onAddGroup: () => void;
  onManageTypes: () => void;
  onOpenSuggestions: () => void;
  onSignOut: () => void;
};

const baseButton =
  "group flex flex-1 flex-col items-center justify-center gap-1.5 rounded-2xl py-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100";
const iconBox =
  "flex h-8 w-8 items-center justify-center rounded-full transition";
const label = "text-[11px] font-bold tracking-wide";

export function AdminBottomNav({
  isAdmin,
  onAddContact,
  onAddGroup,
  onManageTypes,
  onOpenSuggestions,
  onSignOut,
}: Props) {
  return (
    <nav
      aria-label="Actions"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/90 shadow-[0_-6px_24px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90"
    >
      <div
        className="mx-auto flex max-w-2xl items-stretch gap-1 px-3 pt-2"
        style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom))" }}
      >
        <button
          type="button"
          onClick={onAddContact}
          className={`${baseButton} text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-500/15 dark:hover:text-rose-300`}
        >
          <span
            className={`${iconBox} bg-linear-to-br from-rose-500 to-red-600 text-white shadow-lg shadow-rose-600/30 group-hover:scale-105`}
          >
            <PlusIcon className="h-4.5 w-4.5" />
          </span>
          <span className={label}>Contact</span>
        </button>
        <button type="button" onClick={onAddGroup} className={baseButton}>
          <span
            className={`${iconBox} bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-slate-700 dark:group-hover:text-slate-200`}
          >
            <FolderIcon className="h-4.5 w-4.5" />
          </span>
          <span className={label}>Group</span>
        </button>
        {isAdmin && (
          <button type="button" onClick={onManageTypes} className={baseButton}>
            <span
              className={`${iconBox} bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-slate-700 dark:group-hover:text-slate-200`}
            >
              <PillIcon className="h-4.5 w-4.5" />
            </span>
            <span className={label}>Pills</span>
          </button>
        )}
        {isAdmin && (
          <button
            type="button"
            onClick={onOpenSuggestions}
            className={baseButton}
          >
            <span
              className={`${iconBox} bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-slate-700 dark:group-hover:text-slate-200`}
            >
              <MessageSquareIcon className="h-4.5 w-4.5" />
            </span>
            <span className={label}>Suggestions</span>
          </button>
        )}
        <button
          type="button"
          onClick={onSignOut}
          className={`${baseButton} hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/15 dark:hover:text-rose-400`}
        >
          <span
            className={`${iconBox} bg-slate-100 text-slate-500 group-hover:bg-rose-100 group-hover:text-rose-600 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-rose-500/20 dark:group-hover:text-rose-400`}
          >
            <LogOutIcon className="h-4.5 w-4.5" />
          </span>
          <span className={label}>Sign out</span>
        </button>
      </div>
    </nav>
  );
}
