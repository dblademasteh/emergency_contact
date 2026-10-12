"use client";

import type { Contact, ContactInput } from "@/lib/contacts";
import type { Group, GroupInput } from "@/lib/groups";
import type { ContactType, ContactTypeInput } from "@/lib/contact-types";
import { useCsrfFetch } from "@/lib/use-csrf-fetch";

export type CrudResult<T = unknown> = 
  | { success: true; data: T }
  | { success: false; error: string };

export function useSharedCrud() {
  const { csrfFetch } = useCsrfFetch();

  // ==================== CONTACTS ====================

  const createContact = async (input: ContactInput, logo?: string | null): Promise<CrudResult<Contact>> => {
    try {
      const res = await csrfFetch("/api/contacts", {
        method: "POST",
        body: JSON.stringify(input),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error ?? "Failed to add contact." };
      }

      const contact: Contact = json.data ?? (Array.isArray(json) ? json[0] : json);

      if (logo !== undefined) {
        const logoRes = await csrfFetch(`/api/contacts/${contact.id}/logo`, {
          method: "POST",
          body: JSON.stringify({ logo }),
        });
        const logoJson = await logoRes.json();
        if (!logoRes.ok || !logoJson.success) {
          return { success: false, error: logoJson.error ?? "Failed to save logo." };
        }
        contact.logoUrl = logoJson.data?.logoUrl ?? logoJson.logoUrl ?? null;
      }

      return { success: true, data: contact };
    } catch {
      return { success: false, error: "Network error. Check your connection and try again." };
    }
  };

  const updateContact = async (id: string, input: ContactInput, logo?: string | null): Promise<CrudResult<Contact>> => {
    try {
      const res = await csrfFetch(`/api/contacts/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error ?? "Failed to save." };
      }

      const contact: Contact = json.data ?? json;

      if (logo !== undefined) {
        const logoRes = await csrfFetch(`/api/contacts/${id}/logo`, {
          method: "POST",
          body: JSON.stringify({ logo }),
        });
        const logoJson = await logoRes.json();
        if (!logoRes.ok || !logoJson.success) {
          return { success: false, error: logoJson.error ?? "Failed to save logo." };
        }
        contact.logoUrl = logoJson.data?.logoUrl ?? logoJson.logoUrl ?? null;
      }

      return { success: true, data: contact };
    } catch {
      return { success: false, error: "Network error. Check your connection and try again." };
    }
  };

  const deleteContact = async (id: string): Promise<CrudResult<boolean>> => {
    try {
      const res = await csrfFetch(`/api/contacts/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        return { success: false, error: json.error ?? "Failed to delete contact." };
      }

      return { success: true, data: true };
    } catch {
      return { success: false, error: "Network error. Check your connection and try again." };
    }
  };

  // ==================== GROUPS ====================

  const createGroup = async (input: GroupInput, logo?: string | null): Promise<CrudResult<Group>> => {
    try {
      const res = await csrfFetch("/api/groups", {
        method: "POST",
        body: JSON.stringify(input),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error ?? "Failed to add group." };
      }

      const group: Group = json.data ?? json;

      if (logo !== undefined) {
        const logoRes = await csrfFetch(`/api/groups/${group.id}/logo`, {
          method: "POST",
          body: JSON.stringify({ logo }),
        });
        const logoJson = await logoRes.json();
        if (!logoRes.ok || !logoJson.success) {
          return { success: false, error: logoJson.error ?? "Failed to save logo." };
        }
      }

      return { success: true, data: group };
    } catch {
      return { success: false, error: "Network error. Check your connection and try again." };
    }
  };

  const updateGroup = async (id: string, input: GroupInput, logo?: string | null): Promise<CrudResult<Group>> => {
    try {
      const res = await csrfFetch(`/api/groups/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error ?? "Failed to save." };
      }

      const group: Group = json.data ?? json;

      if (logo !== undefined) {
        const logoRes = await csrfFetch(`/api/groups/${id}/logo`, {
          method: "POST",
          body: JSON.stringify({ logo }),
        });
        const logoJson = await logoRes.json();
        if (!logoRes.ok || !logoJson.success) {
          return { success: false, error: logoJson.error ?? "Failed to save logo." };
        }
      }

      return { success: true, data: group };
    } catch {
      return { success: false, error: "Network error. Check your connection and try again." };
    }
  };

  const deleteGroup = async (id: string): Promise<CrudResult<boolean>> => {
    try {
      const res = await csrfFetch(`/api/groups/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        return { success: false, error: json.error ?? "Failed to delete group." };
      }

      return { success: true, data: true };
    } catch {
      return { success: false, error: "Network error. Check your connection and try again." };
    }
  };

  // ==================== TYPES ====================

  const createType = async (input: ContactTypeInput): Promise<CrudResult<ContactType>> => {
    try {
      const res = await csrfFetch("/api/types", {
        method: "POST",
        body: JSON.stringify(input),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error ?? "Failed to add category." };
      }

      return { success: true, data: json.data ?? json };
    } catch {
      return { success: false, error: "Network error. Check your connection and try again." };
    }
  };

  const updateType = async (value: string, input: ContactTypeInput): Promise<CrudResult<ContactType>> => {
    try {
      const res = await csrfFetch(`/api/types/${encodeURIComponent(value)}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error ?? "Failed to save." };
      }

      return { success: true, data: json.data ?? json };
    } catch {
      return { success: false, error: "Network error. Check your connection and try again." };
    }
  };

  const deleteType = async (value: string): Promise<CrudResult<boolean>> => {
    try {
      const res = await csrfFetch(`/api/types/${encodeURIComponent(value)}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        return { success: false, error: json.error ?? "Failed to delete category." };
      }

      return { success: true, data: true };
    } catch {
      return { success: false, error: "Network error. Check your connection and try again." };
    }
  };

  // ==================== HELPERS ====================

  const fetchAllData = async () => {
    const [contactsRes, groupsRes, typesRes, homeRes, fbRes, bfpRes, logoRes, nameRes] =
      await Promise.all([
        fetch("/api/contacts"),
        fetch("/api/groups"),
        fetch("/api/types"),
        fetch("/api/settings/home-image"),
        fetch("/api/settings/facebook-page"),
        fetch("/api/settings/bfp-site"),
        fetch("/api/settings/app-logo"),
        fetch("/api/settings/app-name"),
      ]);

    const parseArray = <T,>(json: unknown): T[] => {
      if (Array.isArray(json)) return json as T[];
      if (json && typeof json === "object" && "data" in json) {
        return (json as { data: T[] }).data ?? [];
      }
      return [];
    };

    const [contactData, groupData, typeData, homeData, fbData, bfpData, logoData, nameData] =
      await Promise.all([
        contactsRes.json().then(parseArray<Contact>),
        groupsRes.json().then(parseArray<Group>),
        typesRes.json().then(parseArray<ContactType>),
        homeRes.ok ? (homeRes.json() as Promise<{ image?: string | null }>) : Promise.resolve({ image: null }),
        fbRes.ok ? (fbRes.json() as Promise<{ url?: string | null }>) : Promise.resolve({ url: null }),
        bfpRes.ok ? (bfpRes.json() as Promise<{ url?: string | null }>) : Promise.resolve({ url: null }),
        logoRes.ok ? (logoRes.json() as Promise<{ logo?: string | null }>) : Promise.resolve({ logo: null }),
        nameRes.ok ? (nameRes.json() as Promise<{ name?: string | null }>) : Promise.resolve({ name: null }),
      ]);

    if (!contactsRes.ok) throw new Error("Failed to load contacts");
    if (!groupsRes.ok) throw new Error("Failed to load groups");
    if (!typesRes.ok) throw new Error("Failed to load categories");

    return {
      contacts: contactData,
      groups: groupData,
      types: typeData,
      homeImage: homeData?.image ?? null,
      facebookPageUrl: fbData?.url ?? null,
      bfpSiteUrl: bfpData?.url ?? null,
      appLogo: logoData?.logo ?? null,
      appName: nameData?.name ?? null,
    };
  };

  return {
    createContact,
    updateContact,
    deleteContact,
    createGroup,
    updateGroup,
    deleteGroup,
    createType,
    updateType,
    deleteType,
    fetchAllData,
  };
}