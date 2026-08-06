"use client";

import { useEffect, useSyncExternalStore, useState } from "react";
import { DownloadIcon } from "@/components/icons";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const subscribeToStandalone = (onStoreChange: () => void) => {
  const match = window.matchMedia("(display-mode: standalone)");
  match.addEventListener("change", onStoreChange);
  return () => match.removeEventListener("change", onStoreChange);
};

export function InstallButton() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const isStandalone = useSyncExternalStore(
    subscribeToStandalone,
    () => window.matchMedia("(display-mode: standalone)").matches,
    () => false
  );

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (isStandalone || !promptEvent) return null;

  return (
    <button
      type="button"
      onClick={async () => {
        await promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        if (outcome === "accepted") setPromptEvent(null);
      }}
      className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
    >
      <DownloadIcon className="h-4 w-4" />
      Install
    </button>
  );
}
