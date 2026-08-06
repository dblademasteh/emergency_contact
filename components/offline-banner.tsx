"use client";

import { useSyncExternalStore } from "react";
import { AlertIcon } from "@/components/icons";

const subscribe = (onStoreChange: () => void) => {
  window.addEventListener("online", onStoreChange);
  window.addEventListener("offline", onStoreChange);
  return () => {
    window.removeEventListener("online", onStoreChange);
    window.removeEventListener("offline", onStoreChange);
  };
};

export function OfflineBanner() {
  const isOnline = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true
  );

  if (isOnline) return null;

  return (
    <div className="flex items-center justify-center gap-2 bg-amber-50 px-4 py-2 text-sm text-amber-800 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30">
      <AlertIcon className="h-4 w-4" />
      You&apos;re offline — showing your last saved contacts.
    </div>
  );
}
