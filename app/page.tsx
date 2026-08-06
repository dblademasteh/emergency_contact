"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Contact, ContactInput } from "@/lib/contacts";
import type { Group, GroupInput } from "@/lib/groups";
import { displayPath, groupPath } from "@/lib/groups";
import {
  categoryStyle,
  type ContactType,
  type ContactTypeInput,
} from "@/lib/contact-types";
import { categoryIcon } from "@/components/category-icons";
import { ContactCard } from "@/components/contact-card";
import { ContactForm } from "@/components/contact-form";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmergencyBanner } from "@/components/emergency-banner";
import { GroupCard } from "@/components/group-card";
import { GroupForm } from "@/components/group-form";
import { HomeImage, type HomeContentLink } from "@/components/home-image";
import { InstallButton } from "@/components/install-button";
import { LogoManager } from "@/components/logo-manager";
import { OfflineBanner } from "@/components/offline-banner";
import { ThemeToggle } from "@/components/theme-toggle";
import { TypeManager } from "@/components/type-manager";
import { AdminBottomNav } from "@/components/admin-bottom-nav";
import { HelpWidget } from "@/components/help-widget";
import { Home } from "lucide-react";
import {
  ChevronLeftIcon,
  FolderIcon,
  PhoneIcon,
  PlusIcon,
  SearchIcon,
} from "@/components/icons";

type Filter = string | "ALL";

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

export default function Page() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [types, setTypes] = useState<ContactType[]>([]);
  const [homeImage, setHomeImage] = useState<string | null>(null);
  const [homeContentImage, setHomeContentImage] = useState<string | null>(null);
  const [homeContentLinks, setHomeContentLinks] = useState<HomeContentLink[]>(
    []
  );
  const [appLogo, setAppLogo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [role, setRole] = useState<"admin" | "user" | null>(null);
  const isAdmin = role === "admin";
  const isEditor = role !== null;
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [saving, setSaving] = useState(false);

  const [groupFormOpen, setGroupFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [groupFormKey, setGroupFormKey] = useState(0);

  const [typeFormOpen, setTypeFormOpen] = useState(false);
  const [editingType, setEditingType] = useState<ContactType | null>(null);
  const [typeFormKey, setTypeFormKey] = useState(0);

  const [dialog, setDialog] = useState<{
    title: string;
    message: string;
    confirmLabel?: string;
    destructive?: boolean;
    onConfirm?: () => void;
  } | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const loadAll = useCallback(async () => {
    const [contactsRes, groupsRes, typesRes, homeRes, contentRes, linksRes, logoRes] =
      await Promise.all([
        fetch("/api/contacts"),
        fetch("/api/groups"),
        fetch("/api/types"),
        fetch("/api/settings/home-image"),
        fetch("/api/settings/home-content-image"),
        fetch("/api/settings/home-content-links"),
        fetch("/api/settings/app-logo"),
      ]);
    if (!contactsRes.ok) throw new Error(`Contacts request failed (${contactsRes.status})`);
    if (!groupsRes.ok) throw new Error(`Groups request failed (${groupsRes.status})`);
    if (!typesRes.ok) throw new Error(`Types request failed (${typesRes.status})`);
    const [contactData, groupData, typeData, homeData, contentData, linksData, logoData] =
      await Promise.all([
        contactsRes.json() as Promise<Contact[]>,
        groupsRes.json() as Promise<Group[]>,
        typesRes.json() as Promise<ContactType[]>,
        homeRes.ok
          ? (homeRes.json() as Promise<{ image?: string | null }>)
          : Promise.resolve({ image: null }),
        contentRes.ok
          ? (contentRes.json() as Promise<{ image?: string | null }>)
          : Promise.resolve({ image: null }),
        linksRes.ok
          ? (linksRes.json() as Promise<{ links?: HomeContentLink[] }>)
          : Promise.resolve({ links: [] }),
        logoRes.ok
          ? (logoRes.json() as Promise<{ logo?: string | null }>)
          : Promise.resolve({ logo: null }),
      ]);
    setContacts(sortContacts(contactData));
    setGroups(sortGroups(groupData));
    setTypes(sortTypes(typeData));
    setHomeImage(homeData?.image ?? null);
    setHomeContentImage(contentData?.image ?? null);
    setHomeContentLinks(linksData?.links ?? []);
    setAppLogo(logoData?.logo ?? null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/contacts"),
      fetch("/api/groups"),
      fetch("/api/types"),
      fetch("/api/settings/home-image"),
      fetch("/api/settings/home-content-image"),
      fetch("/api/settings/home-content-links"),
      fetch("/api/settings/app-logo"),
    ])
      .then(([contactsRes, groupsRes, typesRes, homeRes, contentRes, linksRes, logoRes]) => {
        if (!contactsRes.ok) throw new Error(`Contacts request failed (${contactsRes.status})`);
        if (!groupsRes.ok) throw new Error(`Groups request failed (${groupsRes.status})`);
        if (!typesRes.ok) throw new Error(`Types request failed (${typesRes.status})`);
        return Promise.all([
          contactsRes.json() as Promise<Contact[]>,
          groupsRes.json() as Promise<Group[]>,
          typesRes.json() as Promise<ContactType[]>,
          homeRes.ok
            ? (homeRes.json() as Promise<{ image?: string | null }>)
            : Promise.resolve({ image: null }),
          contentRes.ok
            ? (contentRes.json() as Promise<{ image?: string | null }>)
            : Promise.resolve({ image: null }),
          linksRes.ok
            ? (linksRes.json() as Promise<{ links?: HomeContentLink[] }>)
            : Promise.resolve({ links: [] }),
          logoRes.ok
            ? (logoRes.json() as Promise<{ logo?: string | null }>)
            : Promise.resolve({ logo: null }),
        ]);
      })
      .then(([contactData, groupData, typeData, homeData, contentData, linksData, logoData]) => {
        if (cancelled) return;
        setContacts(sortContacts(contactData));
        setGroups(sortGroups(groupData));
        setTypes(sortTypes(typeData));
        setHomeImage(homeData?.image ?? null);
        setHomeContentImage(contentData?.image ?? null);
        setHomeContentLinks(linksData?.links ?? []);
        setAppLogo(logoData?.logo ?? null);
        setLoadError(null);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Couldn't load contacts.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { role?: "admin" | "user" | null } | null) => {
        if (!cancelled) setRole(data?.role ?? null);
      })
      .catch(() => {
        if (!cancelled) setRole(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setRole(null);
    }
  }, []);

  const groupById = useMemo(
    () => new Map(groups.map((g) => [g.id, g])),
    [groups]
  );

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

  const path = useMemo(
    () => groupPath(currentGroupId, groupById),
    [currentGroupId, groupById]
  );

  const childGroups = useMemo(() => {
    const list = childrenByParent.get(currentGroupId) ?? [];
    if (filter === "ALL") return list;
    return list.filter((g) => g.type === filter);
  }, [childrenByParent, currentGroupId, filter]);

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
    const excluded =
      editingGroup && isEditor ? subtreeIds(editingGroup.id) : new Set<string>();
    return groups
      .filter((g) => !excluded.has(g.id))
      .map((g) => ({ id: g.id, label: displayPath(g.id, groups) }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [groups, editingGroup, isEditor, subtreeIds]);

  const contactGroupOptions = useMemo(
    () =>
      groups
        .map((g) => ({ id: g.id, label: displayPath(g.id, groups), type: g.type }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [groups]
  );

  const visibleContacts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return contacts.filter((c) => {
      if (filter !== "ALL" && c.type !== filter) return false;
      if (q) {
        return (
          c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q)
        );
      }
      if (c.groupId !== currentGroupId) return false;
      return true;
    });
  }, [contacts, query, filter, currentGroupId]);

  const directCountByGroup = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of contacts) {
      if (c.groupId) map.set(c.groupId, (map.get(c.groupId) ?? 0) + 1);
    }
    return map;
  }, [contacts]);

  const primaryCount = contacts.filter((c) => c.isPrimary).length;

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

  const openGroup = (id: string) => {
    setQuery("");
    setCurrentGroupId(id);
  };

  const handleSave = useCallback(
    async (
      input: ContactInput,
      logo?: string | null
    ): Promise<{ error?: string } | void> => {
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
          setContacts((prev) =>
            sortContacts(prev.map((c) => (c.id === data.id ? data : c)))
          );
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
          if (!logoRes.ok) {
            return { error: logoData.error ?? "Failed to save logo." };
          }
          setContacts((prev) =>
            sortContacts(
              prev.map((c) =>
                c.id === id ? { ...c, logoUrl: logoData.logoUrl } : c
              )
            )
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
          const res = await fetch(`/api/contacts/${contact.id}`, {
            method: "DELETE",
          });
          if (!res.ok) {
            setDialog({
              title: "Couldn't delete contact",
              message: "Failed to delete the contact. Please try again.",
            });
            return;
          }
          setContacts((prev) => prev.filter((c) => c.id !== contact.id));
          setDialog(null);
        } catch {
          setDialog({
            title: "Network error",
            message: "Network error. Check your connection and try again.",
          });
        } finally {
          setConfirmBusy(false);
        }
      },
    });
  }, []);

  const handleSaveGroup = useCallback(
    async (
      input: GroupInput,
      logo?: string | null
    ): Promise<{ error?: string } | void> => {
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
          if (!logoRes.ok) {
            return { error: logoData.error ?? "Failed to save logo." };
          }
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
            const res = await fetch(`/api/groups/${group.id}`, {
              method: "DELETE",
            });
            if (!res.ok) {
              setDialog({
                title: "Couldn't delete group",
                message: "Failed to delete the group. Please try again.",
              });
              return;
            }
            setCurrentGroupId(null);
            await loadAll();
            setDialog(null);
          } catch {
            setDialog({
              title: "Network error",
              message: "Network error. Check your connection and try again.",
            });
          } finally {
            setConfirmBusy(false);
          }
        },
      });
    },
    [loadAll]
  );

  const openAddType = () => {
    setEditingType(null);
    setTypeFormKey((k) => k + 1);
    setTypeFormOpen(true);
  };

  const handleSaveType = useCallback(
    async (
      input: ContactTypeInput,
      editingValue?: string
    ): Promise<{ error?: string } | void> => {
      try {
        if (editingValue) {
          const res = await fetch(
            `/api/types/${encodeURIComponent(editingValue)}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(input),
            }
          );
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
            const res = await fetch(
              `/api/types/${encodeURIComponent(type.value)}`,
              { method: "DELETE" }
            );
            if (!res.ok) {
              const data = await res.json().catch(() => null);
              setDialog({
                title: "Couldn't delete category",
                message:
                  data?.error ?? "Failed to delete the category. Please try again.",
              });
              return;
            }
            await loadAll();
            setDialog(null);
          } catch {
            setDialog({
              title: "Network error",
              message: "Network error. Check your connection and try again.",
            });
          } finally {
            setConfirmBusy(false);
          }
        },
      });
    },
    [loadAll]
  );

  const chipClass = (active: boolean, activeCls?: string) =>
    `shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30 focus-visible:ring-offset-1 ${
      active
        ? activeCls ??
          "border-slate-900 bg-slate-900 text-white shadow-md shadow-slate-900/20"
        : "border-slate-300 bg-white text-slate-600 shadow-sm hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-500 dark:hover:text-slate-100"
    }`;

  const searching = query.trim().length > 0;
  const isHome = path.length === 0 && filter === "ALL";

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-32 pt-6">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-linear-to-br from-rose-500 via-red-600 to-red-800 text-white shadow-lg shadow-red-600/30">
            {appLogo ? (
              <img
                src={appLogo}
                alt="App logo"
                className="h-full w-full object-cover"
              />
            ) : (
              <PhoneIcon className="h-6 w-6" />
            )}
            <span
              aria-hidden="true"
              className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-amber-400 ring-2 ring-white"
            />
          </div>
          <div>
            <h1 className="text-lg font-extrabold leading-tight tracking-tight text-slate-900 dark:text-slate-100">
              Emergency Contacts
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {primaryCount > 0
                ? `${primaryCount} pinned · ${contacts.length} total`
                : `${contacts.length} contacts saved`}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <ThemeToggle />
          {!isEditor && (
            <a
              href="/login"
              aria-label="Sign in"
              className="inline-flex items-center gap-1.5 rounded-full bg-linear-to-r from-rose-600 to-red-600 px-4 py-2 text-sm font-bold text-white shadow-md shadow-rose-600/25 transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
            >
              Sign in
            </a>
          )}
          <InstallButton />
          {isAdmin && (
            <span className="hidden rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white sm:inline">
              Admin
            </span>
          )}
        </div>
      </header>

      <LogoManager logo={appLogo} isAdmin={isAdmin} onChanged={setAppLogo} />

      <HomeImage image={homeImage} isAdmin={isAdmin} onChanged={setHomeImage} />

      <OfflineBanner />

      <div className="relative mb-4 mt-6">
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search all contacts…"
          aria-label="Search contacts"
          className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-rose-500 dark:focus:ring-rose-500/20"
        />
      </div>

      <EmergencyBanner />

      <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => {
            setQuery("");
            setFilter("ALL");
            setCurrentGroupId(null);
          }}
          className={chipClass(currentGroupId === null && filter === "ALL")}
        >
          <Home className="h-4 w-4" />
          Home
        </button>
        {types.map((t) => {
          const Icon = categoryIcon(t.icon);
          const activeCls = categoryStyle(t.color).active;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setFilter(filter === t.value ? "ALL" : t.value)}
              className={chipClass(filter === t.value, activeCls)}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {isHome && (
        <HomeImage
          image={homeContentImage}
          isAdmin={isAdmin}
          onChanged={setHomeContentImage}
          endpoint="/api/settings/home-content-image"
          placeholder="Add a photo"
          alt="Home content"
          links={homeContentLinks}
          onLinksChanged={setHomeContentLinks}
        />
      )}

      {!searching && path.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCurrentGroupId(path.length > 1 ? path[path.length - 2].id : null);
            }}
            className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Back
          </button>
          {path.slice(-2).map((group, i) => {
            const isLast = i === path.length - 1;
            return isLast ? (
              <span
                key={group.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-900 bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white shadow-sm"
              >
                <FolderIcon className="h-4 w-4" />
                {group.name}
              </span>
            ) : (
              <button
                key={group.id}
                type="button"
                onClick={() => openGroup(group.id)}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              >
                <FolderIcon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                {group.name}
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
            />
          ))}
        </div>
      ) : loadError ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          {loadError} Pull to refresh, or reload the page.
        </div>
      ) : searching ? (
        <>
          {visibleContacts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-10 text-center dark:border-slate-700 dark:bg-slate-900/70">
              <p className="text-slate-500 dark:text-slate-400">No contacts match your search.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {visibleContacts.map((contact) => (
                <li key={contact.id}>
                  <ContactCard
                    contact={contact}
                    types={types}
                    canEdit={isEditor}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <>
          {childGroups.length > 0 && !isHome && (
            <section className="mb-8" aria-label="Groups">
              <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                <span
                  aria-hidden="true"
                  className="h-2 w-2 rounded-full bg-linear-to-br from-rose-500 to-red-600"
                />
                {path.length === 0 ? "Top level" : "Sub-groups"}
              </h2>
              <ul className="space-y-3">
                {childGroups.map((group) => (
                  <li key={group.id}>
                    <GroupCard
                      name={group.name}
                      type={group.type}
                      types={types}
                      logoUrl={group.logoUrl}
                      contactCount={directCountByGroup.get(group.id) ?? 0}
                      childCount={childrenByParent.get(group.id)?.length ?? 0}
                      canEdit={isEditor}
                      onOpen={() => openGroup(group.id)}
                      onEdit={() => openEditGroup(group)}
                      onDelete={() => handleDeleteGroup(group)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {visibleContacts.length > 0 && !isHome && (
            <section aria-label="Contacts">
              {childGroups.length > 0 && (
                <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  <span
                    aria-hidden="true"
                    className="h-2 w-2 rounded-full bg-linear-to-br from-sky-500 to-blue-600"
                  />
                  Contacts
                </h2>
              )}
              <ul className="space-y-3">
                {visibleContacts.map((contact) => (
                  <li key={contact.id}>
                    <ContactCard
                      contact={contact}
                      types={types}
                      canEdit={isEditor}
                      onEdit={openEdit}
                      onDelete={handleDelete}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {childGroups.length === 0 && visibleContacts.length === 0 && !isHome && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-10 text-center dark:border-slate-700 dark:bg-slate-900/70">
              <p className="text-slate-500 dark:text-slate-400">
                {path.length === 0
                  ? "No groups or contacts yet."
                  : "This group is empty."}
              </p>
              {isEditor && (
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={openAddGroup}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                  >
                    <FolderIcon className="h-4 w-4" />
                    Add a group
                  </button>
                  <button
                    type="button"
                    onClick={openAdd}
                    className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-rose-600 to-red-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-rose-600/25 transition hover:brightness-110"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add a contact
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <p className="mt-8 text-center text-xs text-slate-400 dark:text-slate-500">
        {saving
          ? "Saving…"
          : "Works offline · tap a number to call"}
        {!isEditor && (
          <a href="/login" className="ml-1 text-slate-500 underline dark:text-slate-400">
            Sign in
          </a>
        )}
      </p>

      {isEditor && (
        <AdminBottomNav
          isAdmin={isAdmin}
          onAddContact={openAdd}
          onAddGroup={openAddGroup}
          onManageTypes={openAddType}
          onOpenSuggestions={() => router.push("/admin/suggestions")}
          onSignOut={handleLogout}
        />
      )}

      <HelpWidget isAdmin={isAdmin} />

      <ContactForm
        key={`contact-${formKey}`}
        open={formOpen}
        initial={editing}
        types={types}
        groups={contactGroupOptions}
        defaultGroupId={currentGroupId}
        defaultType={filter === "ALL" ? undefined : filter}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
      />

      <GroupForm
        key={`group-${groupFormKey}`}
        open={groupFormOpen}
        initial={editingGroup}
        types={types}
        defaultParentId={currentGroupId}
        defaultType={filter === "ALL" ? "OTHER" : filter}
        parentOptions={groupOptions}
        onClose={() => setGroupFormOpen(false)}
        onSave={handleSaveGroup}
      />

      <TypeManager
        key={`type-${typeFormKey}`}
        open={typeFormOpen}
        types={types}
        onClose={() => setTypeFormOpen(false)}
        onSave={handleSaveType}
        onDelete={handleDeleteType}
      />

      <ConfirmDialog
        open={dialog !== null}
        title={dialog?.title ?? ""}
        message={dialog?.message ?? ""}
        confirmLabel={dialog?.confirmLabel}
        destructive={dialog?.destructive}
        busy={confirmBusy}
        onConfirm={dialog?.onConfirm}
        onClose={() => {
          if (!confirmBusy) setDialog(null);
        }}
      />
    </main>
  );
}
