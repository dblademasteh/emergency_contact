"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Contact, ContactInput } from "@/lib/contacts";
import type { Group, GroupInput } from "@/lib/groups";
import { displayPath } from "@/lib/groups";
import type { ContactType, ContactTypeInput } from "@/lib/contact-types";
import { categoryStyle } from "@/lib/contact-types";
import { categoryIcon } from "@/components/category-icons";
import { ContactCard } from "@/components/contact-card";
import { ContactForm } from "@/components/contact-form";
import { CsvImport } from "@/components/csv-import";
import { GroupCard } from "@/components/group-card";
import { GroupForm } from "@/components/group-form";
import { TypeManager } from "@/components/type-manager";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PlusIcon, PillIcon, FolderIcon } from "@/components/icons";

function sortContacts(contacts: Contact[]) {
  return [...contacts].sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.name.localeCompare(b.name);
  });
}

function sortGroups(groups: Group[]) {
  return [...groups].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.name.localeCompare(b.name);
  });
}

function sortTypes(types: ContactType[]) {
  return [...types].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.label.localeCompare(b.label);
  });
}

export function AdminContentManager() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [types, setTypes] = useState<ContactType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Contact list filter state
  const [contactFilter, setContactFilter] = useState<string>("ALL");
  const [showAllContacts, setShowAllContacts] = useState(false);

  // Contact form state
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [saving, setSaving] = useState(false);

  // Group form state
  const [groupFormOpen, setGroupFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [groupFormKey, setGroupFormKey] = useState(0);

  // Type form state
  const [typeFormOpen, setTypeFormOpen] = useState(false);
  const [editingType, setEditingType] = useState<ContactType | null>(null);
  const [typeFormKey, setTypeFormKey] = useState(0);

  // Confirm dialog state
  const [dialog, setDialog] = useState<{
    title: string;
    message: string;
    confirmLabel?: string;
    destructive?: boolean;
    onConfirm?: () => void;
  } | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const loadAll = useCallback(async () => {
    const [contactsRes, groupsRes, typesRes] = await Promise.all([
      fetch("/api/contacts"),
      fetch("/api/groups"),
      fetch("/api/types"),
    ]);
    if (!contactsRes.ok) throw new Error("Failed to load contacts");
    if (!groupsRes.ok) throw new Error("Failed to load groups");
    if (!typesRes.ok) throw new Error("Failed to load categories");
    const [contactData, groupData, typeData] = await Promise.all([
      contactsRes.json() as Promise<Contact[]>,
      groupsRes.json() as Promise<Group[]>,
      typesRes.json() as Promise<ContactType[]>,
    ]);
    setContacts(sortContacts(contactData));
    setGroups(sortGroups(groupData));
    setTypes(sortTypes(typeData));
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadAll()
      .then(() => {
        if (!cancelled) setError(null);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load content.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadAll]);

  const childrenByParent = useMemo(() => {
    const map = new Map<string | null, Group[]>();
    for (const group of groups) {
      const key = group.parentId;
      const list = map.get(key) ?? [];
      list.push(group);
      map.set(key, list);
    }
    for (const list of map.values()) sortGroups(list);
    return map;
  }, [groups]);

  const subtreeIds = useCallback(
    (groupId: string): Set<string> => {
      const set = new Set<string>();
      const stack = [groupId];
      while (stack.length) {
        const current = stack.pop()!;
        set.add(current);
        for (const child of childrenByParent.get(current) ?? []) {
          stack.push(child.id);
        }
      }
      return set;
    },
    [childrenByParent]
  );

  const groupOptions = useMemo(() => {
    const excluded = editingGroup ? subtreeIds(editingGroup.id) : new Set<string>();
    return groups
      .filter((g) => !excluded.has(g.id))
      .map((g) => ({ id: g.id, label: displayPath(g.id, groups) }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [groups, editingGroup, subtreeIds]);

  const contactGroupOptions = useMemo(
    () =>
      groups
        .map((g) => ({ id: g.id, label: displayPath(g.id, groups), type: g.type }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [groups]
  );

  const filteredContacts = useMemo(
    () =>
      contactFilter === "ALL"
        ? contacts
        : contacts.filter((c) => c.type === contactFilter),
    [contacts, contactFilter]
  );

  const visibleContacts = showAllContacts
    ? filteredContacts
    : filteredContacts.slice(0, 5);

  const chipClass = (active: boolean, activeCls?: string) =>
    `shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30 focus-visible:ring-offset-1 ${
      active
        ? activeCls ??
          "border-slate-900 bg-slate-900 text-white shadow-md shadow-slate-900/20"
        : "border-slate-300 bg-white text-slate-600 shadow-sm hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-500 dark:hover:text-slate-100"
    }`;

  const openAdd = () => {
    setEditing(null);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  };

  const openEdit = (contact: Contact) => {
    setEditing(contact);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  };

  const openAddGroup = () => {
    setEditingGroup(null);
    setGroupFormKey((k) => k + 1);
    setGroupFormOpen(true);
  };

  const openEditGroup = (group: Group) => {
    setEditingGroup(group);
    setGroupFormKey((k) => k + 1);
    setGroupFormOpen(true);
  };

  const openAddType = () => {
    setEditingType(null);
    setTypeFormKey((k) => k + 1);
    setTypeFormOpen(true);
  };

  const handleSave = useCallback(
    async (input: ContactInput, logo?: string | null): Promise<{ error?: string } | void> => {
      setSaving(true);
      try {
        let id: string;
        if (editing) {
          const res = await fetch(`/api/contacts/${editing.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          });
          const data = await res.json();
          if (!res.ok) return { error: data.error ?? "Failed to save." };
          id = data.id;
          setContacts((prev) => sortContacts(prev.map((c) => (c.id === data.id ? data : c))));
        } else {
          const res = await fetch("/api/contacts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          });
          const data = await res.json();
          if (!res.ok) return { error: data.error ?? "Failed to add contact." };
          id = data.id;
          setContacts((prev) => sortContacts([...prev, data]));
        }
        if (logo !== undefined) {
          const logoRes = await fetch(`/api/contacts/${id}/logo`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ logo }),
          });
          const logoData = await logoRes.json();
          if (!logoRes.ok) return { error: logoData.error ?? "Failed to save logo." };
          setContacts((prev) =>
            sortContacts(prev.map((c) => (c.id === id ? { ...c, logoUrl: logoData.logoUrl } : c)))
          );
        }
      } catch {
        return { error: "Network error. Check your connection and try again." };
      } finally {
        setSaving(false);
      }
    },
    [editing]
  );

  const handleDelete = useCallback((contact: Contact) => {
    setDialog({
      title: "Delete contact",
      message: `Delete "${contact.name}" from your directory?`,
      confirmLabel: "Delete",
      destructive: true,
      onConfirm: async () => {
        setConfirmBusy(true);
        try {
          const res = await fetch(`/api/contacts/${contact.id}`, { method: "DELETE" });
          if (!res.ok) {
            setDialog({ title: "Couldn't delete contact", message: "Failed to delete the contact. Please try again." });
            return;
          }
          setContacts((prev) => prev.filter((c) => c.id !== contact.id));
          setDialog(null);
        } catch {
          setDialog({ title: "Network error", message: "Network error. Check your connection and try again." });
        } finally {
          setConfirmBusy(false);
        }
      },
    });
  }, []);

  const handleSaveGroup = useCallback(
    async (input: GroupInput, logo?: string | null): Promise<{ error?: string } | void> => {
      try {
        let id: string;
        if (editingGroup) {
          const res = await fetch(`/api/groups/${editingGroup.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          });
          const data = await res.json();
          if (!res.ok) return { error: data.error ?? "Failed to save." };
          id = data.id;
        } else {
          const res = await fetch("/api/groups", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          });
          const data = await res.json();
          if (!res.ok) return { error: data.error ?? "Failed to add group." };
          id = data.id;
        }
        if (logo !== undefined) {
          const logoRes = await fetch(`/api/groups/${id}/logo`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ logo }),
          });
          const logoData = await logoRes.json();
          if (!logoRes.ok) return { error: logoData.error ?? "Failed to save logo." };
        }
        await loadAll();
      } catch {
        return { error: "Network error. Check your connection and try again." };
      }
    },
    [editingGroup, loadAll]
  );

  const handleDeleteGroup = useCallback(
    (group: Group) => {
      const warning = `Delete "${group.name}" and everything inside it?\n\nAll sub-groups and contacts in this group will be permanently removed.`;
      setDialog({
        title: "Delete group",
        message: warning,
        confirmLabel: "Delete",
        destructive: true,
        onConfirm: async () => {
          setConfirmBusy(true);
          try {
            const res = await fetch(`/api/groups/${group.id}`, { method: "DELETE" });
            if (!res.ok) {
              setDialog({ title: "Couldn't delete group", message: "Failed to delete the group. Please try again." });
              return;
            }
            await loadAll();
            setDialog(null);
          } catch {
            setDialog({ title: "Network error", message: "Network error. Check your connection and try again." });
          } finally {
            setConfirmBusy(false);
          }
        },
      });
    },
    [loadAll]
  );

  const handleSaveType = useCallback(
    async (input: ContactTypeInput, editingValue?: string): Promise<{ error?: string } | void> => {
      try {
        if (editingValue) {
          const res = await fetch(`/api/types/${encodeURIComponent(editingValue)}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          });
          const data = await res.json();
          if (!res.ok) return { error: data.error ?? "Failed to save." };
        } else {
          const res = await fetch("/api/types", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          });
          const data = await res.json();
          if (!res.ok) return { error: data.error ?? "Failed to add category." };
        }
        await loadAll();
      } catch {
        return { error: "Network error. Check your connection and try again." };
      }
    },
    [loadAll]
  );

  const handleDeleteType = useCallback(
    (type: ContactType) => {
      setDialog({
        title: "Delete category",
        message: `Delete the "${type.label}" category?\n\nContacts and groups using it will be moved to "Other".`,
        confirmLabel: "Delete",
        destructive: true,
        onConfirm: async () => {
          setConfirmBusy(true);
          try {
            const res = await fetch(`/api/types/${encodeURIComponent(type.value)}`, { method: "DELETE" });
            if (!res.ok) {
              const data = await res.json().catch(() => null);
              setDialog({
                title: "Couldn't delete category",
                message: data?.error ?? "Failed to delete the category. Please try again.",
              });
              return;
            }
            await loadAll();
            setDialog(null);
          } catch {
            setDialog({ title: "Network error", message: "Network error. Check your connection and try again." });
          } finally {
            setConfirmBusy(false);
          }
        },
      });
    },
    [loadAll]
  );

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Contacts */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Contacts
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {filteredContacts.length} of {contacts.length} total
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CsvImport
              defaultType={contactFilter !== "ALL" ? contactFilter : undefined}
              onImported={loadAll}
            />
            <button
              type="button"
              onClick={openAdd}
              className="inline-flex items-center gap-1.5 rounded-full bg-linear-to-r from-rose-600 to-red-600 px-3.5 py-1.5 text-sm font-semibold text-white shadow-md shadow-rose-600/25 transition hover:brightness-110"
            >
              <PlusIcon className="h-4 w-4" />
              Add
            </button>
          </div>
        </div>

        {types.length > 0 && (
          <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setContactFilter("ALL")}
              className={chipClass(contactFilter === "ALL")}
            >
              All
            </button>
            {types.map((t) => {
              const Icon = categoryIcon(t.icon);
              const activeCls = categoryStyle(t.color).active;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() =>
                    setContactFilter(contactFilter === t.value ? "ALL" : t.value)
                  }
                  className={chipClass(contactFilter === t.value, activeCls)}
                >
                  <Icon className="h-4 w-4" />
                  {t.label}
                </button>
              );
            })}
          </div>
        )}

        {filteredContacts.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
            {contacts.length === 0 ? "No contacts yet." : "No contacts in this category."}
          </p>
        ) : (
          <ul className="modal-scroll max-h-80 space-y-3 overflow-y-auto pr-1">
            {visibleContacts.map((contact) => (
              <li key={contact.id}>
                <ContactCard
                  contact={contact}
                  types={types}
                  canEdit
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
              </li>
            ))}
          </ul>
        )}

        {filteredContacts.length > 5 && (
          <button
            type="button"
            onClick={() => setShowAllContacts((v) => !v)}
            className="mt-3 w-full rounded-full border border-slate-300 bg-white py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {showAllContacts
              ? "Show less"
              : `Show all ${filteredContacts.length} contacts`}
          </button>
        )}
      </section>

      {/* Groups */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              <FolderIcon className="h-4 w-4 text-slate-400" />
              Groups
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {groups.length} total
            </p>
          </div>
          <button
            type="button"
            onClick={openAddGroup}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <PlusIcon className="h-4 w-4" />
            Add
          </button>
        </div>
        {groups.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
            No groups yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {groups.map((group) => (
              <li key={group.id}>
                <GroupCard
                  name={group.name}
                  type={group.type}
                  types={types}
                  logoUrl={group.logoUrl}
                  contactCount={contacts.filter((c) => c.groupId === group.id).length}
                  childCount={childrenByParent.get(group.id)?.length ?? 0}
                  canEdit
                  onOpen={() => {}}
                  onEdit={() => openEditGroup(group)}
                  onDelete={() => handleDeleteGroup(group)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Pills (types) */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              <PillIcon className="h-4 w-4 text-slate-400" />
              Pills (categories)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {types.length} total
            </p>
          </div>
          <button
            type="button"
            onClick={openAddType}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <PlusIcon className="h-4 w-4" />
            Add
          </button>
        </div>
        <TypeManager
          key={`type-${typeFormKey}`}
          open={typeFormOpen}
          types={types}
          onClose={() => setTypeFormOpen(false)}
          onSave={handleSaveType}
          onDelete={handleDeleteType}
        />
      </section>

      <ContactForm
        key={`contact-${formKey}`}
        open={formOpen}
        initial={editing}
        types={types}
        groups={contactGroupOptions}
        defaultGroupId={null}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
      />

      <GroupForm
        key={`group-${groupFormKey}`}
        open={groupFormOpen}
        initial={editingGroup}
        types={types}
        defaultParentId={null}
        defaultType="OTHER"
        parentOptions={groupOptions}
        onClose={() => setGroupFormOpen(false)}
        onSave={handleSaveGroup}
      />

      <ConfirmDialog
        open={dialog !== null}
        title={dialog?.title ?? ""}
        message={dialog?.message ?? ""}
        confirmLabel={dialog?.confirmLabel}
        destructive={dialog?.destructive}
        busy={confirmBusy}
        onClose={() => setDialog(null)}
        onConfirm={() => dialog?.onConfirm?.()}
      />
    </div>
  );
}
