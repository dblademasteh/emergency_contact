"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Contact } from "@/lib/contacts";
import type { Group } from "@/lib/groups";
import { groupPath } from "@/lib/groups";
import {
  categoryStyle,
  type ContactType,
} from "@/lib/contact-types";
import { categoryIcon } from "@/components/category-icons";
import { ContactCard } from "@/components/contact-card";
import { EmergencyBanner } from "@/components/emergency-banner";
import { GroupCard } from "@/components/group-card";
import { HomeImage } from "@/components/home-image";
import { FacebookFeed } from "@/components/facebook-feed";
import { InstallButton } from "@/components/install-button";
import { OfflineBanner } from "@/components/offline-banner";
import { ThemeToggle } from "@/components/theme-toggle";
import { HelpWidget } from "@/components/help-widget";
import { PhoneIcon, SearchIcon } from "@/components/icons";

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

export default function PublicHome() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [types, setTypes] = useState<ContactType[]>([]);
  const [homeImage, setHomeImage] = useState<string | null>(null);
  const [facebookPageUrl, setFacebookPageUrl] = useState<string | null>(null);
  const [bfpSiteUrl, setBfpSiteUrl] = useState<string | null>(null);
  const [appLogo, setAppLogo] = useState<string | null>(null);
  const [appName, setAppName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);
  const [showAllTypes, setShowAllTypes] = useState(true);
  const [showAllContacts, setShowAllContacts] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // If a logged-in user lands on the public homepage, send them to the app.
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { role?: "admin" | "user" | null } | null) => {
        if (!cancelled && data?.role) router.replace("/app");
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/contacts"),
      fetch("/api/groups"),
      fetch("/api/types"),
      fetch("/api/settings/home-image"),
      fetch("/api/settings/facebook-page"),
      fetch("/api/settings/bfp-site"),
      fetch("/api/settings/app-logo"),
      fetch("/api/settings/app-name"),
    ])
      .then(([contactsRes, groupsRes, typesRes, homeRes, fbRes, bfpRes, logoRes, nameRes]) => {
        if (!contactsRes.ok) throw new Error("Failed to load contacts");
        if (!groupsRes.ok) throw new Error("Failed to load groups");
        if (!typesRes.ok) throw new Error("Failed to load categories");
        return Promise.all([
          contactsRes.json() as Promise<Contact[]>,
          groupsRes.json() as Promise<Group[]>,
          typesRes.json() as Promise<ContactType[]>,
          homeRes.ok ? (homeRes.json() as Promise<{ image?: string | null }>) : Promise.resolve({ image: null }),
          fbRes.ok ? (fbRes.json() as Promise<{ url?: string | null }>) : Promise.resolve({ url: null }),
          bfpRes.ok ? (bfpRes.json() as Promise<{ url?: string | null }>) : Promise.resolve({ url: null }),
          logoRes.ok ? (logoRes.json() as Promise<{ logo?: string | null }>) : Promise.resolve({ logo: null }),
          nameRes.ok ? (nameRes.json() as Promise<{ name?: string | null }>) : Promise.resolve({ name: null }),
        ]);
      })
      .then(([contactData, groupData, typeData, homeData, fbData, bfpData, logoData, nameData]) => {
        if (cancelled) return;
        setContacts(sortContacts(contactData));
        setGroups(sortGroups(groupData));
        setTypes(sortTypes(typeData));
        setHomeImage(homeData?.image ?? null);
        setFacebookPageUrl(fbData?.url ?? null);
        setBfpSiteUrl(bfpData?.url ?? null);
        setAppLogo(logoData?.logo ?? null);
        setAppName(nameData?.name ?? null);
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

  const visibleContacts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return contacts.filter((c) => {
      if (q) {
        return (
          c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q)
        );
      }
      if (filter !== "ALL" && c.type !== filter) return false;
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

  const openGroup = (id: string) => {
    setQuery("");
    setCurrentGroupId(id);
  };

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
    <main id="main" className="mx-auto w-full max-w-2xl flex-1 px-4 pb-32 pt-6">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-linear-to-br from-rose-500 via-red-600 to-red-800 text-white shadow-lg shadow-red-600/30">
            {appLogo ? (
              <img src={appLogo} alt="App logo" className="h-full w-full object-cover" />
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
              {appName || "Beep Me App V2.0"}
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
          <a
            href="/login"
            aria-label="Sign in"
            className="inline-flex items-center gap-1.5 rounded-full bg-linear-to-r from-rose-600 to-red-600 px-4 py-2 text-sm font-bold text-white shadow-md shadow-rose-600/25 transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
          >
            Sign in
          </a>
          <InstallButton />
        </div>
      </header>

      <HomeImage image={homeImage} isAdmin={false} onChanged={() => {}} />

      <OfflineBanner />

      <EmergencyBanner />

      <div className="relative mb-4 mt-2">
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

      <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto pb-1">
        {types.slice(0, showAllTypes ? undefined : 3).map((t) => {
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
        {types.length > 3 && (
          <button
            type="button"
            onClick={() => setShowAllTypes(!showAllTypes)}
            className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {showAllTypes ? "Less" : `+${types.length - 3}`}
          </button>
        )}
      </div>

      {searching && !loading && (
        <>
          {visibleContacts.length === 0 ? (
            <div className="mb-6 rounded-2xl border border-dashed border-slate-300 bg-white/70 p-10 text-center dark:border-slate-700 dark:bg-slate-900/70">
              <p className="text-slate-500 dark:text-slate-400">No contacts match your search.</p>
            </div>
          ) : (
            <ul className="mb-6 space-y-3">
              {(showAllContacts ? visibleContacts : visibleContacts.slice(0, 3)).map((contact) => (
                <li key={contact.id}>
                  <ContactCard
                    contact={contact}
                    types={types}
                    onEdit={() => {}}
                    onDelete={() => {}}
                  />
                </li>
              ))}
            </ul>
          )}
          {visibleContacts.length > 3 && (
            <button
              type="button"
              onClick={() => setShowAllContacts(!showAllContacts)}
              className="mb-6 w-full rounded-full border border-slate-300 bg-white py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {showAllContacts ? "Show less" : `Show all ${visibleContacts.length} contacts`}
            </button>
          )}
        </>
      )}

      {isHome && (
        <FacebookFeed
          pageUrl={facebookPageUrl}
          bfpSiteUrl={bfpSiteUrl}
          isAdmin={false}
          onChanged={() => {}}
          onBfpChanged={() => {}}
        />
      )}

      {!searching && path.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentGroupId(path.length > 1 ? path[path.length - 2].id : null)}
            className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            ← Back
          </button>
          {path.slice(-2).map((group, i) => {
            const isLast = i === path.length - 1;
            return isLast ? (
              <span
                key={group.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-900 bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white shadow-sm"
              >
                {group.name}
              </span>
            ) : (
              <button
                key={group.id}
                type="button"
                onClick={() => openGroup(group.id)}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              >
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
      ) : searching ? null : (
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
                      onOpen={() => openGroup(group.id)}
                      onEdit={() => {}}
                      onDelete={() => {}}
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
                {(showAllContacts ? visibleContacts : visibleContacts.slice(0, 3)).map((contact) => (
                  <li key={contact.id}>
                    <ContactCard
                      contact={contact}
                      types={types}
                      onEdit={() => {}}
                      onDelete={() => {}}
                    />
                  </li>
                ))}
              </ul>
              {visibleContacts.length > 3 && (
                <button
                  type="button"
                  onClick={() => setShowAllContacts(!showAllContacts)}
                  className="mt-3 w-full rounded-full border border-slate-300 bg-white py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  {showAllContacts ? "Show less" : `Show all ${visibleContacts.length} contacts`}
                </button>
              )}
            </section>
          )}

          {childGroups.length === 0 && visibleContacts.length === 0 && !isHome && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-10 text-center dark:border-slate-700 dark:bg-slate-900/70">
              <p className="text-slate-500 dark:text-slate-400">
                {path.length === 0 ? "No groups or contacts yet." : "This group is empty."}
              </p>
            </div>
          )}
        </>
      )}

      <footer className="mt-10">
        <div className="relative overflow-hidden rounded-[1.75rem] bg-linear-to-br from-rose-600 via-red-600 to-red-800 p-5 text-white shadow-xl shadow-red-900/30">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10"
          />
          <span
            aria-hidden="true"
            className="animate-beacon pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/20"
          />
          <span
            aria-hidden="true"
            className="hazard-stripes pointer-events-none absolute inset-x-0 bottom-0 h-2.5"
          />
          <div className="relative flex items-center justify-between gap-4">
            <p className="flex min-w-0 items-center gap-2 text-sm font-semibold text-red-100">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
              </span>
              Works offline · tap a number to call
            </p>
            <a
              href="/login"
              className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-bold text-rose-700 shadow-md transition hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-rose-600"
            >
              Sign in
            </a>
          </div>
        </div>
      </footer>

      <HelpWidget isAdmin={false} />
    </main>
  );
}
