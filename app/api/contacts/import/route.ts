import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contacts, contactTypes, groups } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SESSION_COOKIE, isEditorToken } from "@/lib/auth";

type Row = {
  name: string;
  phone: string;
  type?: string;
  note?: string;
  latitude?: number | null;
  longitude?: number | null;
  facebookUrl?: string;
  isPrimary?: boolean;
  groupId?: string;
};

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
  }
  result.push(current.trim());
  return result;
}

function parseCsv(text: string): Row[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, "_"));
  const rows: Row[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = values[idx] ?? "";
    });

    const name = obj["name"] ?? obj["contact_name"] ?? obj["full_name"] ?? "";
    const phone = obj["phone"] ?? obj["phone_number"] ?? obj["contact_number"] ?? obj["mobile"] ?? "";

    if (!name && !phone) continue;

    const rawType = obj["type"] ?? obj["category"] ?? obj["category_type"] ?? "";
    const note = obj["note"] ?? obj["notes"] ?? obj["remarks"] ?? "";
    const rawLat = obj["latitude"] ?? obj["lat"] ?? "";
    const rawLng = obj["longitude"] ?? obj["lng"] ?? obj["lon"] ?? "";
    const facebookUrl = obj["facebook"] ?? obj["facebook_url"] ?? obj["fb"] ?? "";
    const rawPrimary = obj["primary"] ?? obj["is_primary"] ?? obj["pin"] ?? "";
    const groupId = obj["group_id"] ?? obj["group"] ?? "";

    let latitude: number | null = null;
    let longitude: number | null = null;
    if (rawLat && rawLng) {
      const lat = parseFloat(rawLat);
      const lng = parseFloat(rawLng);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        latitude = lat;
        longitude = lng;
      }
    }

    rows.push({
      name: name.trim(),
      phone: phone.trim(),
      type: rawType.trim().toUpperCase().replace(/\s+/g, "_") || undefined,
      note: note.trim() || undefined,
      latitude,
      longitude,
      facebookUrl: facebookUrl.trim() || undefined,
      isPrimary: rawPrimary === "1" || rawPrimary.toLowerCase() === "true" || rawPrimary.toLowerCase() === "yes",
      groupId: groupId.trim() || undefined,
    });
  }

  return rows;
}

export async function POST(request: NextRequest) {
  if (!isEditorToken(request.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const { csv, defaultType, defaultGroupId } = body as {
    csv?: string;
    defaultType?: string;
    defaultGroupId?: string;
  };

  if (!csv || typeof csv !== "string") {
    return NextResponse.json({ error: "CSV data is required." }, { status: 400 });
  }

  const rows = parseCsv(csv);
  if (rows.length === 0) {
    return NextResponse.json({ error: "No valid rows found in CSV." }, { status: 400 });
  }

  const validTypes = new Set(
    (await db.select({ value: contactTypes.value }).from(contactTypes)).map((t) => t.value)
  );

  const created: { id: string; name: string }[] = [];
  const errors: { row: number; error: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    if (!row.name) {
      errors.push({ row: rowNum, error: "Name is required." });
      continue;
    }
    if (!row.phone) {
      errors.push({ row: rowNum, error: "Phone is required." });
      continue;
    }

    let type = row.type || defaultType || "OTHER";

    if (row.groupId) {
      const [group] = await db
        .select()
        .from(groups)
        .where(eq(groups.id, row.groupId))
        .limit(1);
      if (group) {
        type = group.type;
      } else {
        errors.push({ row: rowNum, error: `Group "${row.groupId}" not found.` });
        continue;
      }
    } else if (defaultGroupId) {
      const [group] = await db
        .select()
        .from(groups)
        .where(eq(groups.id, defaultGroupId))
        .limit(1);
      if (group) {
        type = group.type;
      }
    }

    if (!validTypes.has(type)) {
      type = "OTHER";
    }

    try {
      const [contact] = await db
        .insert(contacts)
        .values({
          name: row.name,
          phone: row.phone,
          type,
          note: row.note ?? null,
          latitude: row.latitude,
          longitude: row.longitude,
          facebookUrl: row.facebookUrl ?? null,
          isPrimary: row.isPrimary ?? false,
          groupId: row.groupId || defaultGroupId || null,
          sortOrder: i,
        })
        .returning();
      created.push({ id: contact.id, name: contact.name });
    } catch {
      errors.push({ row: rowNum, error: "Failed to create contact." });
    }
  }

  return NextResponse.json({
    imported: created.length,
    errors,
    total: rows.length,
  });
}