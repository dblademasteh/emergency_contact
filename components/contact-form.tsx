"use client";

import { useEffect, useRef, useState } from "react";
import type { Contact, ContactInput } from "@/lib/contacts";
import { categoryStyle, type ContactType } from "@/lib/contact-types";
import {
  ACCEPTED_LOGO_TYPES,
  MAX_LOGO_SOURCE_SIZE,
  readImageAsDataUrl,
} from "@/lib/client-image";
import { XIcon } from "@/components/icons";

type Props = {
  open: boolean;
  initial: Contact | null;
  types: ContactType[];
  groups: { id: string; label: string; type: string }[];
  defaultGroupId: string | null;
  defaultType?: string;
  onClose: () => void;
  onSave: (
    input: ContactInput,
    logo?: string | null
  ) => Promise<{ error?: string } | void>;
};

export function ContactForm({
  open,
  initial,
  types,
  groups,
  defaultGroupId,
  defaultType,
  onClose,
  onSave,
}: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [type, setType] = useState<string>(
    initial?.type ?? defaultType ?? types[0]?.value ?? "OTHER"
  );
  const [note, setNote] = useState(initial?.note ?? "");
  const [logoData, setLogoData] = useState<string | null>(
    initial?.logoUrl ?? null
  );
  const [logoChanged, setLogoChanged] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [latitude, setLatitude] = useState(
    initial?.latitude != null ? String(initial.latitude) : ""
  );
  const [longitude, setLongitude] = useState(
    initial?.longitude != null ? String(initial.longitude) : ""
  );
  const [facebookUrl, setFacebookUrl] = useState(initial?.facebookUrl ?? "");
  const [isPrimary, setIsPrimary] = useState(initial?.isPrimary ?? false);
  const [groupId, setGroupId] = useState(
    initial?.groupId ?? defaultGroupId ?? ""
  );
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) nameRef.current?.focus();
  }, [open]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!phone.trim()) {
      setError("Phone number is required.");
      return;
    }

    setSubmitting(true);
    const result = await onSave(
      {
        name: name.trim(),
        phone: phone.trim(),
        type,
        note: note.trim() || null,
        latitude: latitude.trim() ? Number(latitude) : null,
        longitude: longitude.trim() ? Number(longitude) : null,
        facebookUrl: facebookUrl.trim() || null,
        isPrimary,
        groupId: groupId || null,
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

  function handleUseMyLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation isn't supported on this device.");
      return;
    }
    setError(null);
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(String(pos.coords.latitude));
        setLongitude(String(pos.coords.longitude));
        setLocating(false);
      },
      () => {
        setLocating(false);
        setError("Couldn't get your location. Check browser permissions.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function handleLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!ACCEPTED_LOGO_TYPES.includes(file.type)) {
      setLogoError("Please choose a PNG, JPEG, WebP, or GIF image.");
      return;
    }
    if (file.size > MAX_LOGO_SOURCE_SIZE) {
      setLogoError("Image must be 20 MB or smaller.");
      return;
    }
    readImageAsDataUrl(file)
      .then((dataUrl) => {
        setLogoData(dataUrl);
        setLogoChanged(true);
        setLogoError(null);
      })
      .catch(() => {
        setLogoError("Couldn't read that image. Try another file.");
      });
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
        aria-label={initial ? "Edit contact" : "Add contact"}
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:max-w-md sm:rounded-3xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            {initial ? "Edit contact" : "Add a contact"}
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
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-700">
              Name
            </label>
            <input
              ref={nameRef}
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Police, Mom, Poison Control"
              className={inputClass}
              maxLength={100}
            />
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Logo <span className="font-normal text-slate-400">(optional)</span>
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
                  <span
                    aria-hidden="true"
                    className={`h-3.5 w-3.5 rounded-full ${categoryStyle(types.find((t) => t.value === type)?.color ?? "slate").dot}`}
                  />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => logoRef.current?.click()}
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
                  ref={logoRef}
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

          <div>
            <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-slate-700">
              Phone number
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 911 or +1 555 010 1234"
              className={inputClass}
              maxLength={30}
            />
          </div>

          <div>
            <label htmlFor="type" className="mb-1.5 block text-sm font-medium text-slate-700">
              Category
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              disabled={Boolean(groupId)}
              className={`${inputClass} disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500`}
            >
              {types.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="note" className="mb-1.5 block text-sm font-medium text-slate-700">
              Note <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Ask for extension 22"
              rows={2}
              className={`${inputClass} resize-none`}
              maxLength={500}
            />
          </div>

          <div>
            <label htmlFor="contact-group" className="mb-1.5 block text-sm font-medium text-slate-700">
              Group <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <select
              id="contact-group"
              value={groupId}
              onChange={(e) => {
                const value = e.target.value;
                setGroupId(value);
                const group = groups.find((g) => g.id === value);
                if (group) setType(group.type);
              }}
              className={inputClass}
            >
              <option value="">No group</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
            {groupId && (
              <p className="mt-1.5 text-xs text-slate-400">
                Category is locked to the selected group.
              </p>
            )}
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="latitude" className="block text-sm font-medium text-slate-700">
                Location <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={locating}
                className="text-xs font-semibold text-slate-600 transition hover:text-slate-900 disabled:opacity-60"
              >
                {locating ? "Locating…" : "Use my location"}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <input
                  id="latitude"
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="Latitude"
                  className={inputClass}
                />
              </div>
              <div>
                <input
                  id="longitude"
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="Longitude"
                  className={inputClass}
                />
              </div>
            </div>
            <p className="mt-1.5 text-xs text-slate-400">
              Opens in Google Maps when tapped. Both are required if you add a location.
            </p>
          </div>

          <div>
            <label htmlFor="facebook-url" className="mb-1.5 block text-sm font-medium text-slate-700">
              Facebook URL <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              id="facebook-url"
              type="url"
              value={facebookUrl}
              onChange={(e) => setFacebookUrl(e.target.value)}
              placeholder="e.g. facebook.com/police"
              className={inputClass}
              maxLength={200}
            />
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-rose-600 accent-rose-600"
            />
            <span className="text-sm text-slate-700">
              Pin to the top as a primary contact
            </span>
          </label>

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
              {submitting ? "Saving…" : initial ? "Save changes" : "Add contact"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
