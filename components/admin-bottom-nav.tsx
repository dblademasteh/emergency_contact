"use client";

import {
  HomeIcon,
  LogOutIcon,
  MessageSquareIcon,
  SettingsIcon,
} from "@/components/icons";

type Props = {
  isAdmin: boolean;
  /** Which dock item is highlighted: "home" (default), "suggestions" or "settings". */
  activePage?: "home" | "suggestions" | "settings";
  /** Unread count shown as a badge on the Suggestions item. */
  pendingSuggestions?: number;
  onHome: () => void;
  onOpenSuggestions: () => void;
  onOpenSettings: () => void;
  /** Called only after the user confirms the sign-out dialog. */
  onSignOut: () => void;
};

const iconBox =
  "flex h-9 w-9 items-center justify-center rounded-full transition group-active:scale-90";

export function AdminBottomNav({
  isAdmin,
  activePage = "home",
  pendingSuggestions = 0,
  onHome,
  onOpenSuggestions,
  onOpenSettings,
  onSignOut,
}: Props) {
  const needsConfirm = true;

  const inactiveIconBox =
    "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-slate-700 dark:group-hover:text-slate-200";
  const inactiveText = "text-slate-500 dark:text-slate-400";
  const activeText = "text-rose-600 dark:text-rose-400";
  const activeIconBox =
    "bg-linear-to-br from-rose-500 to-red-600 text-white shadow-lg shadow-rose-600/30 group-hover:scale-105";

  const buttonCls = (active: boolean) =>
    `group flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-2 transition active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50 ${
      active ? activeText : inactiveText
    } hover:bg-slate-100/80 dark:hover:bg-slate-800/80`;

  const renderItem = (
    key: "home" | "suggestions" | "settings",
    label: string,
    Icon: typeof HomeIcon,
    onClick: () => void
  ) => {
    const active = activePage === key;
    return (
      <button
        key={key}
        type="button"
        onClick={onClick}
        aria-current={active ? "page" : undefined}
        className={buttonCls(active)}
      >
        <span className={`${iconBox} ${active ? activeIconBox : inactiveIconBox}`}>
          <Icon className="h-4.5 w-4.5" />
        </span>
        <span className="relative text-[11px] font-bold tracking-wide">
          {label}
          {key === "suggestions" && pendingSuggestions > 0 && (
            <span
              aria-label={`${pendingSuggestions} pending suggestions`}
              className="absolute -right-3.5 -top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow ring-1 ring-white dark:ring-slate-950"
            >
              {pendingSuggestions > 9 ? "9+" : pendingSuggestions}
            </span>
          )}
        </span>
      </button>
    );
  };

  return (
    <>
      <nav
        aria-label="Actions"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4"
        style={{
          paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))",
        }}
      >
        <div className="pointer-events-auto mx-auto flex max-w-md items-stretch gap-1 rounded-3xl border border-slate-200/70 bg-white/90 p-1.5 shadow-[0_12px_40px_rgba(15,23,42,0.18)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">
          {renderItem("home", "Home", HomeIcon, onHome)}
          {isAdmin &&
            renderItem("suggestions", "Inbox", MessageSquareIcon, onOpenSuggestions)}
          {isAdmin && renderItem("settings", "Settings", SettingsIcon, onOpenSettings)}

          <button
            type="button"
            onClick={() => {
              if (needsConfirm) {
                const ok = window.confirm(
                  "Sign out of Beep Me App?\n\nAny unsaved changes will be lost."
                );
                if (!ok) return;
              }
              onSignOut();
            }}
            className={`group flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50 dark:text-slate-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-400`}
          >
            <span
              className={`${iconBox} bg-slate-100 text-slate-500 group-hover:bg-rose-100 group-hover:text-rose-600 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-rose-500/20 dark:group-hover:text-rose-400`}
            >
              <LogOutIcon className="h-4.5 w-4.5" />
            </span>
            <span className="text-[11px] font-bold tracking-wide">Sign out</span>
          </button>
        </div>
      </nav>
    </>
  );
}