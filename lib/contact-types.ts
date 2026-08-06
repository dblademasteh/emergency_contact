export const CATEGORY_COLORS = [
  "rose",
  "blue",
  "orange",
  "emerald",
  "violet",
  "amber",
  "slate",
] as const;
export type CategoryColor = (typeof CATEGORY_COLORS)[number];

export const CATEGORY_STYLES: Record<
  CategoryColor,
  { badge: string; dot: string; active: string; tile: string }
> = {
  rose: {
    badge: "bg-rose-100 text-rose-700 ring-rose-200",
    dot: "bg-rose-500",
    active: "border-rose-600 bg-linear-to-r from-rose-600 to-red-500 text-white shadow-md shadow-rose-600/25",
    tile: "bg-linear-to-br from-rose-500 to-red-500",
  },
  blue: {
    badge: "bg-blue-100 text-blue-700 ring-blue-200",
    dot: "bg-blue-500",
    active: "border-blue-600 bg-linear-to-r from-blue-600 to-sky-500 text-white shadow-md shadow-blue-600/25",
    tile: "bg-linear-to-br from-blue-500 to-sky-500",
  },
  orange: {
    badge: "bg-orange-100 text-orange-700 ring-orange-200",
    dot: "bg-orange-500",
    active: "border-orange-600 bg-linear-to-r from-orange-600 to-amber-500 text-white shadow-md shadow-orange-600/25",
    tile: "bg-linear-to-br from-orange-500 to-amber-500",
  },
  emerald: {
    badge: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-500",
    active: "border-emerald-600 bg-linear-to-r from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-600/25",
    tile: "bg-linear-to-br from-emerald-500 to-teal-500",
  },
  violet: {
    badge: "bg-violet-100 text-violet-700 ring-violet-200",
    dot: "bg-violet-500",
    active: "border-violet-600 bg-linear-to-r from-violet-600 to-purple-500 text-white shadow-md shadow-violet-600/25",
    tile: "bg-linear-to-br from-violet-500 to-purple-500",
  },
  amber: {
    badge: "bg-amber-100 text-amber-700 ring-amber-200",
    dot: "bg-amber-500",
    active: "border-amber-500 bg-linear-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/25",
    tile: "bg-linear-to-br from-amber-400 to-orange-500",
  },
  slate: {
    badge: "bg-slate-100 text-slate-600 ring-slate-200",
    dot: "bg-slate-400",
    active: "border-slate-700 bg-linear-to-r from-slate-700 to-slate-900 text-white shadow-md shadow-slate-700/25",
    tile: "bg-linear-to-br from-slate-500 to-slate-700",
  },
};

export function categoryStyle(color: string): {
  badge: string;
  dot: string;
  active: string;
  tile: string;
} {
  return (
    (CATEGORY_STYLES as Record<
      string,
      { badge: string; dot: string; active: string; tile: string }
    >)[color] ?? CATEGORY_STYLES.slate
  );
}

export const CATEGORY_ICONS = [
  // Emergency & medical
  "siren",
  "shield",
  "flame",
  "cross",
  "ambulance",
  "hospital",
  "stethoscope",
  "heart",
  "heart-pulse",
  "thermometer",
  "pill",
  // People & family
  "users",
  "contact",
  "baby",
  "dog",
  // Home & places
  "home",
  "building",
  "school",
  "graduation-cap",
  "map-pin",
  // Transport
  "car",
  "bus",
  "truck",
  "anchor",
  // Utilities & repair
  "wrench",
  "droplet",
  "plug",
  "key",
  "lightbulb",
  "wifi",
  // Work & money
  "briefcase",
  "wallet",
  "shopping-cart",
  "utensils",
  // Everything else
  "bell",
  "star",
  "cloud",
  "zap",
  "more",
] as const;
export type CategoryIcon = (typeof CATEGORY_ICONS)[number];

export type ContactType = {
  value: string;
  label: string;
  color: string;
  icon: string;
  sortOrder: number;
  isDefault: boolean;
};

export type ContactTypeInput = {
  label: string;
  color: string;
  icon: string;
  sortOrder?: number;
};

export function parseContactTypeInput(body: unknown):
  | { data: ContactTypeInput }
  | { error: string } {
  if (!body || typeof body !== "object") {
    return { error: "Invalid request body." };
  }

  const raw = body as Record<string, unknown>;
  const label = typeof raw.label === "string" ? raw.label.trim() : "";
  const color = typeof raw.color === "string" ? raw.color : "";
  const icon = typeof raw.icon === "string" ? raw.icon : "";

  if (!label) return { error: "Label is required." };
  if (label.length > 30) return { error: "Label must be 30 characters or fewer." };
  if (!CATEGORY_COLORS.some((c) => c === color)) {
    return { error: "Unknown color." };
  }
  if (!CATEGORY_ICONS.some((i) => i === icon)) {
    return { error: "Unknown icon." };
  }

  const sortOrder =
    typeof raw.sortOrder === "number" && Number.isFinite(raw.sortOrder)
      ? Math.round(raw.sortOrder)
      : undefined;

  return { data: { label, color, icon, sortOrder } };
}

export function slugifyTypeValue(label: string): string {
  const base =
    label
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "TYPE";
  return base;
}
