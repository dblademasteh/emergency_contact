export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type FaqInput = {
  question: string;
  answer: string;
  sortOrder?: number;
};

export function parseFaqInput(
  body: unknown
): { data: FaqInput } | { error: string } {
  if (!body || typeof body !== "object") {
    return { error: "Invalid request body." };
  }

  const raw = body as Record<string, unknown>;
  const question = typeof raw.question === "string" ? raw.question.trim() : "";
  const answer = typeof raw.answer === "string" ? raw.answer.trim() : "";

  if (!question) return { error: "Question is required." };
  if (question.length > 200)
    return { error: "Question must be 200 characters or fewer." };
  if (!answer) return { error: "Answer is required." };
  if (answer.length > 5000)
    return { error: "Answer must be 5000 characters or fewer." };

  let sortOrder: number | undefined;
  if (raw.sortOrder != null && raw.sortOrder !== "") {
    sortOrder = Number(raw.sortOrder);
    if (!Number.isFinite(sortOrder)) {
      return { error: "Sort order is invalid." };
    }
  }

  return { data: { question, answer, sortOrder } };
}
