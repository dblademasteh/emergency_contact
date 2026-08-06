import { CONTACT_TYPES, type ContactTypeValue } from "@/lib/contacts";

export type Group = {
  id: string;
  name: string;
  type: ContactTypeValue;
  parentId: string | null;
  logoUrl: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type GroupInput = {
  name: string;
  type: ContactTypeValue;
  parentId: string | null;
  sortOrder?: number;
};

export function parseGroupInput(body: unknown):
  | { data: GroupInput }
  | { error: string } {
  if (!body || typeof body !== "object") {
    return { error: "Invalid request body." };
  }

  const raw = body as Record<string, unknown>;
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  const type = raw.type as ContactTypeValue;
  const parentId =
    typeof raw.parentId === "string" && raw.parentId ? raw.parentId : null;

  if (!name) return { error: "Name is required." };
  if (name.length > 100) return { error: "Name must be 100 characters or fewer." };
  if (!CONTACT_TYPES.some((t) => t.value === type)) {
    return { error: "Unknown contact type." };
  }

  return { data: { name, type, parentId } };
}

export function groupPath(
  groupId: string | null,
  groupsById: Map<string, Group>
): Group[] {
  const path: Group[] = [];
  let current: Group | undefined = groupId
    ? groupsById.get(groupId)
    : undefined;
  while (current) {
    path.unshift(current);
    current = current.parentId ? groupsById.get(current.parentId) : undefined;
  }
  return path;
}

export function displayPath(groupId: string | null, groups: Group[]): string {
  if (!groupId) return "Ungrouped";
  const byId = new Map(groups.map((g) => [g.id, g]));
  return groupPath(groupId, byId)
    .map((g) => g.name)
    .join(" / ");
}
