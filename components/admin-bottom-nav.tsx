"use client";

import {
  FolderIcon,
  LogOutIcon,
  PillIcon,
  PlusIcon,
} from "@/components/icons";

type Props = {
  onAddContact: () => void;
  onAddGroup: () => void;
  onManageTypes: () => void;
  onSignOut: () => void;
};

const baseButton =
  "flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30";
const label = "text-[11px] font-bold";

export function AdminBottomNav({
  onAddContact,
  onAddGroup,
  onManageTypes,
  onSignOut,
}: Props) {
  return (
    <nav
      aria-label="Admin actions"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur"
    >
      <div
        className="mx-auto flex max-w-2xl items-stretch gap-1 px-3 pt-1.5"
        style={{ paddingBottom: "calc(0.375rem + env(safe-area-inset-bottom))" }}
      >
        <button
          type="button"
          onClick={onAddContact}
          className={`${baseButton} text-rose-600 hover:bg-rose-50 hover:text-rose-700`}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-rose-500 to-red-600 text-white shadow-lg shadow-rose-600/30">
            <PlusIcon className="h-4.5 w-4.5" />
          </span>
          <span className={label}>Contact</span>
        </button>
        <button type="button" onClick={onAddGroup} className={baseButton}>
          <FolderIcon className="h-6 w-6" />
          <span className={label}>Group</span>
        </button>
        <button type="button" onClick={onManageTypes} className={baseButton}>
          <PillIcon className="h-6 w-6" />
          <span className={label}>Pills</span>
        </button>
        <button
          type="button"
          onClick={onSignOut}
          className={`${baseButton} hover:bg-rose-50 hover:text-rose-600`}
        >
          <LogOutIcon className="h-6 w-6" />
          <span className={label}>Sign out</span>
        </button>
      </div>
    </nav>
  );
}
