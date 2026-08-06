"use client";

import { categoryStyle, type ContactType } from "@/lib/contact-types";
import { categoryIcon } from "@/components/category-icons";
import { ChevronRightIcon, EditIcon, TrashIcon } from "@/components/icons";

type Props = {
  name: string;
  type: string;
  types: ContactType[];
  logoUrl?: string | null;
  contactCount: number;
  childCount: number;
  canEdit?: boolean;
  onOpen: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function GroupCard({
  name,
  type,
  types,
  logoUrl,
  contactCount,
  childCount,
  canEdit = false,
  onOpen,
  onEdit,
  onDelete,
}: Props) {
  const typeInfo = types.find((t) => t.value === type);
  const styles = categoryStyle(typeInfo?.color ?? "slate");
  const label = typeInfo?.label ?? "Other";
  const Icon = categoryIcon(typeInfo?.icon ?? "more");
  const subCount =
    childCount > 0 && contactCount > 0
      ? `${childCount} sub ${childCount === 1 ? "group" : "groups"} · ${contactCount} ${contactCount === 1 ? "contact" : "contacts"}`
      : childCount > 0
        ? `${childCount} sub ${childCount === 1 ? "group" : "groups"}`
        : `${contactCount} ${contactCount === 1 ? "contact" : "contacts"}`;

  return (
    <article className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
      <button
        type="button"
        onClick={onOpen}
        className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-white shadow-md transition ${styles.tile}`}
        aria-label={`Open ${name}`}
      >
        {logoUrl ? (
          <img
            src={logoUrl}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <Icon className="h-5 w-5" />
        )}
      </button>

      <button
        type="button"
        onClick={onOpen}
        className="min-w-0 flex-1 text-left"
      >
        <h3 className="truncate font-bold text-slate-900 dark:text-slate-100">{name}</h3>
        <div className="mt-0.5 flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${styles.badge}`}
          >
            {label}
          </span>
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{subCount}</span>
        </div>
      </button>

      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open ${name}`}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
      >
        <ChevronRightIcon className="h-5 w-5" />
      </button>

      {canEdit && (
        <div className="flex shrink-0 flex-col gap-2">
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${name}`}
            className="flex h-11 w-11 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <EditIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete ${name}`}
            className="flex h-11 w-11 items-center justify-center rounded-full text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40 dark:text-slate-400 dark:hover:bg-rose-500/15 dark:hover:text-rose-400"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      )}
    </article>
  );
}
