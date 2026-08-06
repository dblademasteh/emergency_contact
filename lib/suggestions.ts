export type Suggestion = {
  id: string;
  message: string;
  office: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SuggestionInput = {
  message: string;
  office?: string | null;
};

export function parseSuggestionInput(
  body: unknown
): { data: SuggestionInput } | { error: string } {
  if (!body || typeof body !== "object") {
    return { error: "Invalid request body." };
  }

  const raw = body as Record<string, unknown>;
  const message = typeof raw.message === "string" ? raw.message.trim() : "";
  const office =
    typeof raw.office === "string" ? raw.office.trim() : raw.office == null ? "" : "";

  if (!message) return { error: "Please write a suggestion." };
  if (message.length > 2000)
    return { error: "Suggestion must be 2000 characters or fewer." };
  if (office.length > 100)
    return { error: "Office must be 100 characters or fewer." };

  return {
    data: {
      message,
      office: office || null,
    },
  };
}
