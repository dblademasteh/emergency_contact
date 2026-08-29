"use client";

import { useEffect, useRef } from "react";

/**
 * Traps keyboard focus inside a modal/dialog while it's open, and restores
 * focus to the element that opened it when it closes. This is essential for
 * keyboard and screen-reader users — without it, Tab can move focus out of
 * the dialog into the page behind.
 *
 * Usage:
 *   const { containerRef, triggerRef } = useFocusTrap(open);
 *   <button ref={triggerRef} onClick={() => setOpen(true)}>Open</button>
 *   {open && <div ref={containerRef} role="dialog">...</div>}
 */
export function useFocusTrap(open: boolean) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const container = containerRef.current;
    if (!container) return;

    const previouslyFocused =
      (document.activeElement as HTMLElement | null) ?? null;

    // Move focus into the dialog on open.
    const focusables = () =>
      Array.from(
        container.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetParent !== null);

    const first = focusables()[0];
    if (first) first.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (active === firstEl || !container.contains(active)) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        if (active === lastEl || !container.contains(active)) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      // Restore focus to the trigger when the dialog closes.
      if (previouslyFocused && previouslyFocused.focus) {
        previouslyFocused.focus();
      }
    };
  }, [open]);

  return { containerRef, triggerRef };
}
