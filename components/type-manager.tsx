"use client";

import { useEffect, useRef, useState } from "react";
import {
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  CATEGORY_STYLES,
  type ContactType,
  type ContactTypeInput,
} from "@/lib/contact-types";
import { categoryIcon } from "@/components/category-icons";
import { EditIcon, PillIcon, PlusIcon, TrashIcon, XIcon } from "@/components/icons";

type Props = {
  open: boolean;
  types: ContactType[];
  onClose: () => void;
  onSave: (
    input: ContactTypeInput,
    editingValue?: string
  ) => Promise<{ error?: string } | void>;
  onDelete: (type: ContactType) => void;
};

export function TypeManager({
  open,
  types,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const [label, setLabel] = useState("");
  const [color, setColor] = useState<string>("slate");
  const [icon, setIcon] = useState<string>("more");
  const [sortOrder, setSortOrder] = useState("");
  const [editingValue, setEditingValue] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) nameRef.current?.focus();
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, submitting, onClose]);

  if (!open) return null;

  function startAdd() {
    setEditingValue(null);
    setLabel("");
    setColor("slate");
    setIcon("more");
    setSortOrder("");
    setError(null);
    nameRef.current?.focus();
  }

  function startEdit(t: ContactType) {
    setEditingValue(t.value);
    setLabel(t.label);
    setColor(t.color);
    setIcon(t.icon);
    setSortOrder(String(t.sortOrder));
    setError(null);
    nameRef.current?.focus();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = parseLocalInput(label, color, icon, sortOrder);
    if ("error" in parsed) {
      setError(parsed.error);
      return;
    }

    setSubmitting(true);
    const result = await onSave(parsed.data, editingValue ?? undefined);
    setSubmitting(false);

    if (result && "error" in result) {
      setError(result.error ?? "Something went wrong.");
      return;
    }

    startAdd();
  }

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Manage categories"
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:max-w-lg sm:rounded-3xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
              <PillIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Categories
              </h2>
              <p className="text-sm text-slate-500">
                {editingValue ? "Edit a category" : "Add a new category"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="type-label"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Label
            </label>
            <input
              ref={nameRef}
              id="type-label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Emergency, Police, Fire…"
              className={inputClass}
              maxLength={30}
            />
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Color
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {CATEGORY_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={`Use ${c} color`}
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/40 ${
                    color === c
                      ? "ring-2 ring-slate-900 ring-offset-2"
                      : "hover:scale-110"
                  }`}
                >
                  <span
                    className={`h-5 w-5 rounded-full ${CATEGORY_STYLES[c].dot}`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Icon
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {CATEGORY_ICONS.map((key) => {
                const Icon = categoryIcon(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setIcon(key)}
                    aria-label={`Use ${key} icon`}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/40 ${
                      icon === key
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label
              htmlFor="type-sort"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Order
            </label>
            <input
              id="type-sort"
              type="number"
              inputMode="numeric"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              placeholder="0"
              className={inputClass}
            />
            <p className="mt-1.5 text-xs text-slate-400">
              Lower numbers appear first in the filter row.
            </p>
          </div>

          {error && (
            <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={startAdd}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              New
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-linear-to-r from-rose-600 to-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-rose-600/25 transition hover:brightness-110 disabled:opacity-60"
            >
              {submitting
                ? "Saving…"
                : editingValue
                  ? "Save changes"
                  : "Add category"}
            </button>
          </div>
        </form>

        <div className="mt-6 border-t border-slate-100 pt-5">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">
              Existing categories
            </h3>
            <button
              type="button"
              onClick={startAdd}
              className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              New
            </button>
          </div>
          <ul className="space-y-2">
            {[...types]
              .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label))
              .map((t) => {
                const Icon = categoryIcon(t.icon);
                return (
                  <li
                    key={t.value}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5"
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-600 ring-1 ring-slate-200 ${CATEGORY_STYLES[t.color as keyof typeof CATEGORY_STYLES]?.badge ?? ""}`}
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {t.label}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {t.value}
                        {t.isDefault ? " · default" : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => startEdit(t)}
                      aria-label={`Edit ${t.label}`}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                      <EditIcon className="h-4.5 w-4.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(t)}
                      aria-label={`Delete ${t.label}`}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
                    >
                      <TrashIcon className="h-4.5 w-4.5" />
                    </button>
                  </li>
                );
              })}
          </ul>
        </div>
      </div>
    </div>
  );
}

function parseLocalInput(
  label: string,
  color: string,
  icon: string,
  sortOrder: string
): { data: ContactTypeInput } | { error: string } {
  const trimmed = label.trim();
  if (!trimmed) return { error: "Label is required." };
  if (trimmed.length > 30)
    return { error: "Label must be 30 characters or fewer." };
  if (!CATEGORY_COLORS.some((c) => c === color)) return { error: "Unknown color." };
  if (!CATEGORY_ICONS.some((i) => i === icon)) return { error: "Unknown icon." };

  const parsedOrder =
    sortOrder.trim() === "" ? undefined : Number(sortOrder);
  const sort =
    typeof parsedOrder === "number" && Number.isFinite(parsedOrder)
      ? Math.round(parsedOrder)
      : undefined;

  return { data: { label: trimmed, color, icon, sortOrder: sort } };
}
