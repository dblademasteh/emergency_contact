"use client";

import type { Contact } from "@/lib/contacts";
import { categoryStyle, type ContactType } from "@/lib/contact-types";
import {
  EditIcon,
  FacebookIcon,
  MapPinIcon,
  PhoneIcon,
  TrashIcon,
} from "@/components/icons";

type Props = {
  contact: Contact;
  types: ContactType[];
  canEdit?: boolean;
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
};

export function ContactCard({
  contact,
  types,
  canEdit = false,
  onEdit,
  onDelete,
}: Props) {
  const typeInfo = types.find((t) => t.value === contact.type);
  const styles = categoryStyle(typeInfo?.color ?? "slate");
  const label = typeInfo?.label ?? "Other";
  const href = `tel:${contact.phone.replace(/\s+/g, "")}`;

  return (
    <article className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50 ring-1 ring-slate-200">
        {contact.logoUrl ? (
          <img
            src={contact.logoUrl}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <span
            aria-hidden="true"
            className={`h-3 w-3 rounded-full ${styles.dot}`}
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate font-semibold text-slate-900">{contact.name}</h3>
          {contact.isPrimary && (
            <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[11px] font-medium text-white">
              Primary
            </span>
          )}
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${styles.badge}`}
          >
            {label}
          </span>
        </div>
        <p className="mt-0.5 truncate text-sm text-slate-600">{contact.phone}</p>
        {contact.note && (
          <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">{contact.note}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <a
          href={href}
          aria-label={`Call ${contact.name}`}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-rose-600 text-white shadow-sm transition hover:bg-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
        >
          <PhoneIcon className="h-5 w-5" />
        </a>
        {contact.facebookUrl && (
          <a
            href={contact.facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${contact.name} on Facebook`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#1877F2] text-white shadow-sm transition hover:bg-[#145dbf]"
          >
            <FacebookIcon className="h-5 w-5" />
          </a>
        )}
        {contact.latitude != null && contact.longitude != null && (
          <a
            href={`https://www.google.com/maps?q=${contact.latitude},${contact.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${contact.name}'s location in maps`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm transition hover:bg-emerald-700"
          >
            <MapPinIcon className="h-5 w-5" />
          </a>
        )}
        {canEdit && (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => onEdit(contact)}
              aria-label={`Edit ${contact.name}`}
              className="flex h-11 w-11 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30"
            >
              <EditIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(contact)}
              aria-label={`Delete ${contact.name}`}
              className="flex h-11 w-11 items-center justify-center rounded-full text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
