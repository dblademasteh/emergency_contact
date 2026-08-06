export const CONTACT_TYPES = [
  { value: "EMERGENCY", label: "Emergency" },
  { value: "POLICE", label: "Police" },
  { value: "FIRE", label: "Fire" },
  { value: "MEDICAL", label: "Medical" },
  { value: "FAMILY", label: "Family" },
  { value: "UTILITY", label: "Utility" },
  { value: "OTHER", label: "Other" },
] as const;

export type ContactTypeValue = (typeof CONTACT_TYPES)[number]["value"];

export type Contact = {
  id: string;
  name: string;
  phone: string;
  type: ContactTypeValue;
  note: string | null;
  logoUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  facebookUrl: string | null;
  isPrimary: boolean;
  sortOrder: number;
  groupId: string | null;
  createdAt: string;
  updatedAt: string;
};

export const CATEGORY_STYLES: Record<
  ContactTypeValue,
  { badge: string; dot: string }
> = {
  EMERGENCY: { badge: "bg-rose-100 text-rose-700 ring-rose-200", dot: "bg-rose-500" },
  POLICE: { badge: "bg-blue-100 text-blue-700 ring-blue-200", dot: "bg-blue-500" },
  FIRE: { badge: "bg-orange-100 text-orange-700 ring-orange-200", dot: "bg-orange-500" },
  MEDICAL: { badge: "bg-emerald-100 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500" },
  FAMILY: { badge: "bg-violet-100 text-violet-700 ring-violet-200", dot: "bg-violet-500" },
  UTILITY: { badge: "bg-amber-100 text-amber-700 ring-amber-200", dot: "bg-amber-500" },
  OTHER: { badge: "bg-slate-100 text-slate-600 ring-slate-200", dot: "bg-slate-400" },
};

export type ContactInput = {
  name: string;
  phone: string;
  type: ContactTypeValue;
  note?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  facebookUrl?: string | null;
  isPrimary?: boolean;
  groupId?: string | null;
};

export function parseContactInput(body: unknown):
  | { data: ContactInput }
  | { error: string } {
  if (!body || typeof body !== "object") {
    return { error: "Invalid request body." };
  }

  const raw = body as Record<string, unknown>;
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  const phone = typeof raw.phone === "string" ? raw.phone.trim() : "";
  const type = raw.type as ContactTypeValue;
  const note =
    typeof raw.note === "string" ? raw.note.trim() : raw.note == null ? "" : "";

  if (!name) return { error: "Name is required." };
  if (name.length > 100) return { error: "Name must be 100 characters or fewer." };
  if (!phone) return { error: "Phone number is required." };
  if (phone.length > 30) return { error: "Phone number is too long." };
  if (!CONTACT_TYPES.some((t) => t.value === type)) {
    return { error: "Unknown contact type." };
  }
  if (note.length > 500) return { error: "Note must be 500 characters or fewer." };

  const hasLat = raw.latitude != null && raw.latitude !== "";
  const hasLng = raw.longitude != null && raw.longitude !== "";
  if (hasLat !== hasLng) {
    return { error: "Both latitude and longitude are required." };
  }
  let latitude: number | null = null;
  let longitude: number | null = null;
  if (hasLat) {
    latitude = Number(raw.latitude);
    longitude = Number(raw.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return { error: "Location must be numbers." };
    }
    if (latitude < -90 || latitude > 90) {
      return { error: "Latitude must be between -90 and 90." };
    }
    if (longitude < -180 || longitude > 180) {
      return { error: "Longitude must be between -180 and 180." };
    }
  }

  const rawFacebook = typeof raw.facebookUrl === "string" ? raw.facebookUrl.trim() : "";
  let facebookUrl: string | null = null;
  if (rawFacebook) {
    if (rawFacebook.length > 200) {
      return { error: "Facebook URL must be 200 characters or fewer." };
    }
    const candidate = /^https?:\/\//i.test(rawFacebook)
      ? rawFacebook
      : `https://${rawFacebook}`;
    try {
      const parsed = new URL(candidate);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return { error: "Facebook URL must use http(s)." };
      }
      facebookUrl = parsed.href;
    } catch {
      return { error: "Facebook URL is not valid." };
    }
  }

  const isPrimary = raw.isPrimary === true;
  const groupId =
    typeof raw.groupId === "string" && raw.groupId ? raw.groupId : null;

  return {
    data: {
      name,
      phone,
      type,
      note: note || null,
      latitude,
      longitude,
      facebookUrl,
      isPrimary,
      groupId,
    },
  };
}
