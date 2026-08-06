"use client";

import { useEffect, useRef, useState } from "react";
import {
  CONTACT_TYPES,
  type ContactTypeValue,
} from "@/lib/contacts";
import type { Group, GroupInput } from "@/lib/groups";
import {
  ACCEPTED_LOGO_TYPES,
  MAX_LOGO_SOURCE_SIZE,
  readImageAsDataUrl,
} from "@/lib/client-image";
import { FolderIcon, XIcon } from "@/components/icons";

type Props = {
  open: boolean;
  initial: Group | null;
  defaultParentId: string | null;
  defaultType: ContactTypeValue;
  parentOptions: { id: string; label: string }[];
  onClose: () => void;
  onSave: (
    input: GroupInput,
    logo?: string | null
  ) => Promise<{ error?: string } | void>;
};

export function GroupForm({
  open,
  initial,
  defaultParentId,
  defaultType,
  parentOptions,
  onClose,
  onSave,
}: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<ContactTypeValue>(
    initial?.type ?? defaultType
  );
  const [parentId, setParentId] = useState<string>(
    initial?.parentId ?? defaultParentId ?? "__root__"
  );
  const [logoData, setLogoData] = useState<string | null>(
    initial?.logoUrl ?? null
  );
  const [logoChanged, setLogoChanged] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) nameRef.current?.focus();
  }, [open]);

  function readImage(file: File): Promise<string> {
    return readImageAsDataUrl(file);
  }

  async function handleLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!ACCEPTED_LOGO_TYPES.includes(file.type)) {
      setLogoError("Please choose a PNG, JPEG, WebP, or GIF image.");
      return;
    }
    if (file.size > MAX_LOGO_SOURCE_SIZE) {
      setLogoError("Image must be 2 MB or smaller.");
      return;
    }
    try {
      const dataUrl = await readImage(file);
      setLogoData(dataUrl);
      setLogoChanged(true);
      setLogoError(null);
    } catch {
      setLogoError("Couldn't read that image. Try another file.");
    }
  }

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    setSubmitting(true);
    const result = await onSave(
      {
        name: name.trim(),
        type,
        parentId: parentId === "__root__" ? null : parentId,
      },
      logoChanged ? logoData : undefined
    );
    setSubmitting(false);

    if (result && "error" in result) {
      setError(result.error ?? "Something went wrong.");
      return;
    }
    onClose();
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
        aria-label={initial ? "Edit group" : "Add group"}
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:max-w-md sm:rounded-3xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            {initial ? "Edit group" : "Add a group"}
          </h2>
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
            <label htmlFor="group-name" className="mb-1.5 block text-sm font-medium text-slate-700">
              Name
            </label>
            <input
              ref={nameRef}
              id="group-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. District Office, Dispatch, Field Team…"
              className={inputClass}
              maxLength={100}
            />
          </div>

          <div>
            <label htmlFor="group-type" className="mb-1.5 block text-sm font-medium text-slate-700">
              Category
            </label>
            <select
              id="group-type"
              value={type}
              onChange={(e) => setType(e.target.value as ContactTypeValue)}
              className={inputClass}
            >
              {CONTACT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-slate-400">
              Contacts added to this group will use this category.
            </p>
          </div>

          <div>
            <label htmlFor="group-parent" className="mb-1.5 block text-sm font-medium text-slate-700">
              Parent
            </label>
            <select
              id="group-parent"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className={inputClass}
            >
              <option value="__root__">
                {parentOptions.length === 0 ? "Top level" : "None (top level)"}
              </option>
              {parentOptions.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Logo
            </span>
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-50 ring-1 ring-slate-200">
                {logoData ? (
                  <img
                    src={logoData}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <FolderIcon className="h-7 w-7 text-slate-400" />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  {logoData ? "Change logo" : "Upload logo"}
                </button>
                {logoData && (
                  <button
                    type="button"
                    onClick={() => {
                      setLogoData(null);
                      setLogoChanged(true);
                      setLogoError(null);
                    }}
                    className="text-sm font-medium text-rose-600 transition hover:text-rose-700"
                  >
                    Remove logo
                  </button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept={ACCEPTED_LOGO_TYPES.join(",")}
                  onChange={handleLogoFile}
                  className="hidden"
                />
              </div>
            </div>
            {logoError && (
              <p className="mt-1.5 text-xs text-rose-600">{logoError}</p>
            )}
          </div>

          {error && (
            <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 ring-1 ring-rose-200">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
            >
              {submitting ? "Saving…" : initial ? "Save changes" : "Add group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
