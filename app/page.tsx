"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { FaqPanel } from "@/components/faq-panel";
import { UserHeader } from "@/components/user-header";
import { GuestBottomNav, type GuestTab } from "@/components/guest-bottom-nav";
import { OfflineBanner } from "@/components/offline-banner";
import { HelpWidget } from "@/components/help-widget";
import { PhoneIcon, SearchIcon } from "@/components/icons";
import { ContactListSkeleton } from "@/components/skeleton";

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
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [facebookPageUrl, setFacebookPageUrl] = useState<string | null>(null);
  const [bfpSiteUrl, setBfpSiteUrl] = useState<string | null>(null);
  const [appLogo, setAppLogo] = useState<string | null>(null);
  const [, setAppName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);
  const [showAllContacts, setShowAllContacts] = useState(false);
  const [activeTab, setActiveTab] = useState<GuestTab>("home");

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
      fetch("/api/settings/banner-image"),
      fetch("/api/settings/facebook-page"),
      fetch("/api/settings/bfp-site"),
      fetch("/api/settings/app-logo"),
      fetch("/api/settings/app-name"),
    ])
      .then(([contactsRes, groupsRes, typesRes, homeRes, bannerRes, fbRes, bfpRes, logoRes, nameRes]) => {
        if (!contactsRes.ok) throw new Error("Failed to load contacts");
        if (!groupsRes.ok) throw new Error("Failed to load groups");
        if (!typesRes.ok) throw new Error("Failed to load categories");
        return Promise.all([
          contactsRes.json().then((j: { data?: Contact[] } | Contact[]) => (Array.isArray(j) ? j : j.data ?? [])),
          groupsRes.json().then((j: { data?: Group[] } | Group[]) => (Array.isArray(j) ? j : j.data ?? [])),
          typesRes.json().then((j: { data?: ContactType[] } | ContactType[]) => (Array.isArray(j) ? j : j.data ?? [])),
          homeRes.ok ? (homeRes.json() as Promise<{ image?: string | null }>) : Promise.resolve({ image: null }),
          bannerRes.ok ? (bannerRes.json() as Promise<{ image?: string | null }>) : Promise.resolve({ image: null }),
          fbRes.ok ? (fbRes.json() as Promise<{ url?: string | null }>) : Promise.resolve({ url: null }),
          bfpRes.ok ? (bfpRes.json() as Promise<{ url?: string | null }>) : Promise.resolve({ url: null }),
          logoRes.ok ? (logoRes.json() as Promise<{ logo?: string | null }>) : Promise.resolve({ logo: null }),
          nameRes.ok ? (nameRes.json() as Promise<{ name?: string | null }>) : Promise.resolve({ name: null }),
        ]);
      })
      .then(([contactData, groupData, typeData, homeData, bannerData, fbData, bfpData, logoData, nameData]) => {
        if (cancelled) return;
        setContacts(sortContacts(contactData));
        setGroups(sortGroups(groupData));
        setTypes(sortTypes(typeData));
        setHomeImage(homeData?.image ?? null);
        setBannerImage(bannerData?.image ?? null);
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

  const emergencyNumber = contacts.find((c) => c.isPrimary)?.phone ?? null;
  const emergencyTel = (emergencyNumber ?? "911").replace(/\s+/g, "");

  const scrollToId = useCallback((id: string | null) => {
    if (id === null) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    requestAnimationFrame(() => {
      document
        .getElementById(id)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const handleTabChange = useCallback(
    (tab: GuestTab) => {
      setActiveTab(tab);
      if (tab === "home") scrollToId(null);
      else if (tab === "hotlines") scrollToId("hotlines");
      else if (tab === "tips") scrollToId("safety-tips");
      else scrollToId("more");
    },
    [scrollToId]
  );

  const focusSearch = () => {
    setActiveTab("home");
    const input = document.getElementById("contact-search");
    input?.scrollIntoView({ behavior: "smooth", block: "center" });
    (input as HTMLInputElement | null)?.focus({ preventScroll: true });
  };

  const openGroup = (id: string) => {
    setQuery("");
    setShowAllContacts(false);
    setCurrentGroupId(id);
    setActiveTab("hotlines");
    scrollToId("hotlines");
  };

  const goHomeGroups = () => {
    setQuery("");
    setFilter("ALL");
    setShowAllContacts(false);
    setCurrentGroupId(null);
  };

  const chipClass = (active: boolean, activeCls?: string) =>
    `shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30 focus-visible:ring-offset-1 ${
      active
        ? activeCls ??
          "border-slate-900 bg-slate-900 text-white shadow-md shadow-slate-900/20"
        : "border-slate-300 bg-white text-slate-600 shadow-sm hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-500 dark:hover:text-slate-100"
    }`;

  const searching = query.trim().length > 0;

  return (
    <div className="mx-auto w-full max-w-[430px]">
      <main id="main" className="w-full flex-1 px-4 pb-36 pt-4">
        <div id="top" className="scroll-mt-20">
          <UserHeader
            logo={appLogo}
            activeTab={activeTab}
            onNavigate={handleTabChange}
            onSearch={focusSearch}
            emergencyTel={emergencyTel}
          />
        </div>

        {/* Hero fold */}
        <HomeImage image={homeImage} isAdmin={false} onChanged={() => {}} />

        <OfflineBanner />

        {/* Prioritized action — front and center right below the hero */}
        <EmergencyBanner image={bannerImage} />

        <div className="relative mb-4 mt-2">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="contact-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search all contacts…"
            aria-label="Search contacts"
            className="min-h-[48px] w-full rounded-2xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-rose-500 dark:focus:ring-rose-500/20"
          />
        </div>

        <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto pb-1">
          {types
            .filter((t) => /(fire|police|rescue)/i.test(`${t.value} ${t.label}`))
            .map((t) => {
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
                      groupName={contact.groupId ? groupById.get(contact.groupId)?.name : undefined}
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
                className="mb-6 min-h-[44px] w-full rounded-full border border-slate-300 bg-white py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {showAllContacts ? "Show less" : `Show all ${visibleContacts.length} contacts`}
              </button>
            )}
          </>
        )}

        {!searching && path.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentGroupId(path.length > 1 ? path[path.length - 2].id : null)}
              className="inline-flex min-h-[44px] items-center gap-1 rounded-full border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
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
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                >
                  {group.name}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Agency hotlines: vertical card stack with touch arrows ── */}
        <section id="hotlines" aria-label="Agency hotlines" className="mb-8 scroll-mt-20">
          <div className="mb-3 flex items-end justify-between gap-2">
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full bg-linear-to-br from-rose-500 to-red-600"
              />
              {path.length === 0 ? "Agency hotlines" : "Sub-groups"}
            </h2>
            {path.length === 0 && (
              <button
                type="button"
                onClick={goHomeGroups}
                className="text-xs font-semibold text-rose-600 hover:underline dark:text-rose-400"
              >
                {childGroups.length} agencies
              </button>
            )}
          </div>
          <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
            BFP · PNP · NDRRMC · DOH — tap the arrow to open a hotline.
          </p>

          {loading ? (
            <ContactListSkeleton count={3} />
          ) : loadError ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
              {loadError} Pull to refresh, or reload the page.
            </div>
          ) : (
            <>
              {childGroups.length > 0 && (
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
              )}

              {path.length > 0 && visibleContacts.length > 0 && (
                <div className={childGroups.length > 0 ? "mt-6" : undefined}>
                  {childGroups.length > 0 && (
                    <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      <span
                        aria-hidden="true"
                        className="h-2 w-2 rounded-full bg-linear-to-br from-sky-500 to-blue-600"
                      />
                      {path.length === 0 ? "Direct lines" : "Contacts"}
                    </h3>
                  )}
                  <ul className="space-y-3">
                    {(showAllContacts ? visibleContacts : visibleContacts.slice(0, 3)).map((contact) => (
                      <li key={contact.id}>
                        <ContactCard
                          contact={contact}
                          types={types}
                          groupName={contact.groupId ? groupById.get(contact.groupId)?.name : undefined}
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
                      className="mt-3 min-h-[44px] w-full rounded-full border border-slate-300 bg-white py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      {showAllContacts ? "Show less" : `Show all ${visibleContacts.length} contacts`}
                    </button>
                  )}
                </div>
              )}

              {childGroups.length === 0 && visibleContacts.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-10 text-center dark:border-slate-700 dark:bg-slate-900/70">
                  <p className="text-slate-500 dark:text-slate-400">
                    {path.length === 0 ? "No groups or contacts yet." : "This group is empty."}
                  </p>
                </div>
              )}
            </>
          )}
        </section>

        {/* ── Safety tips ── */}
        <section id="safety-tips" aria-label="Safety tips" className="mb-8 scroll-mt-20">
          <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full bg-linear-to-br from-emerald-500 to-teal-600"
            />
            Safety tips
          </h2>
          <FacebookFeed
            pageUrl={facebookPageUrl}
            bfpSiteUrl={bfpSiteUrl}
            isAdmin={false}
            onChanged={() => {}}
            onBfpChanged={() => {}}
          />
          <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-3 text-sm font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              What to know before you call
            </h3>
            <FaqPanel isAdmin={false} />
          </div>
        </section>

        {/* ── More: thumb-friendly quick actions ── */}
        <section id="more" aria-label="More actions" className="mb-8 scroll-mt-20">
          <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full bg-linear-to-br from-slate-500 to-slate-700"
            />
            More
          </h2>
          <div className="space-y-3">
            <a
              href={`tel:${emergencyTel}`}
              className="flex min-h-[60px] items-center gap-3 rounded-2xl bg-linear-to-br from-rose-600 via-red-600 to-red-800 p-4 text-white shadow-lg shadow-red-900/25 transition hover:brightness-110 active:scale-[0.99]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
                <PhoneIcon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-extrabold">Call {emergencyNumber ?? "911"}</span>
                <span className="block text-xs text-red-100">Police · Fire · Medical — 24/7</span>
              </span>
              <span aria-hidden="true" className="text-xl font-black">›</span>
            </a>
            <button
              type="button"
              onClick={focusSearch}
              className="flex min-h-[60px] w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md active:scale-[0.99] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <SearchIcon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-slate-900 dark:text-slate-100">Search contacts</span>
                <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                  {contacts.length} saved · {groups.length} groups
                </span>
              </span>
              <span aria-hidden="true" className="text-xl font-black text-slate-300 dark:text-slate-600">›</span>
            </button>
            <a
              href="/login"
              className="flex min-h-[60px] items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-rose-200 hover:shadow-md active:scale-[0.99] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-rose-500/40"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300">
                <PhoneIcon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-slate-900 dark:text-slate-100">Sign in</span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">Manage contacts and groups</span>
              </span>
              <span aria-hidden="true" className="text-xl font-black text-slate-300 dark:text-slate-600">›</span>
            </a>
          </div>
        </section>

        <HelpWidget isAdmin={false} />

        <GuestBottomNav activeTab={activeTab} onTabChange={handleTabChange} emergencyNumber={emergencyNumber} onSearch={focusSearch} />
      </main>
    </div>
  );
}
