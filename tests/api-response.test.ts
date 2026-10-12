import { describe, it, expect } from "vitest";
import {
  apiOk,
  apiCreated,
  apiError,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  apiConflict,
  parsePagination,
  withApiHandler,
} from "@/lib/api-response";

async function body(res: Response) {
  return res.json();
}

describe("apiOk", () => {
  it("wraps data in { success: true, data }", async () => {
    const res = apiOk({ id: "1" });
    expect(res.status).toBe(200);
    expect(await body(res)).toEqual({ success: true, data: { id: "1" } });
  });

  it("passes through meta when provided", async () => {
    const res = apiOk({ id: "1" }, { page: 1 });
    expect(await body(res)).toEqual({
      success: true,
      data: { id: "1" },
      meta: { page: 1 },
    });
  });
});

describe("apiCreated", () => {
  it("returns 201 with success + data", async () => {
    const res = apiCreated({ id: "abc" });
    expect(res.status).toBe(201);
    expect(await body(res)).toEqual({ success: true, data: { id: "abc" } });
  });
});

describe("apiError", () => {
  it("returns 400 by default", async () => {
    const res = apiError("Bad request");
    expect(res.status).toBe(400);
    expect(await body(res)).toEqual({ success: false, error: "Bad request" });
  });

  it("uses provided status code", async () => {
    const res = apiError("Forbidden", 403);
    expect(res.status).toBe(403);
  });
});

describe("apiUnauthorized", () => {
  it("returns 401 with default message", async () => {
    const res = apiUnauthorized();
    expect(res.status).toBe(401);
    expect(await body(res)).toEqual({ success: false, error: "Authentication required." });
  });

  it("uses provided message", async () => {
    const res = apiUnauthorized("Token expired");
    expect(await body(res)).toEqual({ success: false, error: "Token expired" });
  });
});

describe("apiForbidden", () => {
  it("returns 403", async () => {
    const res = apiForbidden();
    expect(res.status).toBe(403);
    expect(await body(res)).toEqual({
      success: false,
      error: "You don't have permission to do that.",
    });
  });
});

describe("apiNotFound", () => {
  it("returns 404 with default message", async () => {
    const res = apiNotFound();
    expect(res.status).toBe(404);
    expect(await body(res)).toEqual({ success: false, error: "Resource not found." });
  });

  it("uses provided message", async () => {
    const res = apiNotFound("Contact not found");
    expect(await body(res)).toEqual({ success: false, error: "Contact not found" });
  });
});

describe("apiConflict", () => {
  it("returns 409", async () => {
    const res = apiConflict("Duplicate entry");
    expect(res.status).toBe(409);
    expect(await body(res)).toEqual({ success: false, error: "Duplicate entry" });
  });
});

describe("parsePagination", () => {
  it("uses defaults when params are missing", () => {
    const result = parsePagination(new URLSearchParams());
    expect(result).toEqual({ page: 1, limit: 50, offset: 0 });
  });

  it("parses page and limit", () => {
    const result = parsePagination(new URLSearchParams("page=3&limit=20"));
    expect(result).toEqual({ page: 3, limit: 20, offset: 40 });
  });

  it("clamps invalid page to 1", () => {
    const result = parsePagination(new URLSearchParams("page=-5"));
    expect(result.page).toBe(1);
  });

  it("clamps invalid limit to 1", () => {
    const result = parsePagination(new URLSearchParams("limit=0"));
    expect(result.limit).toBe(1);
  });

  it("caps limit at 200", () => {
    const result = parsePagination(new URLSearchParams("limit=9999"));
    expect(result.limit).toBe(200);
  });
});

describe("withApiHandler", () => {
  it("passes through successful responses", async () => {
    const handler = withApiHandler(async (_req: Request) => apiOk({ ok: true }));
    const res = await handler(new Request("https://example.com"));
    expect(res.status).toBe(200);
    expect(await body(res)).toEqual({ success: true, data: { ok: true } });
  });

  it("catches thrown errors and returns 500", async () => {
    const handler = withApiHandler(async (_req: Request) => {
      throw new Error("boom");
    });
    const res = await handler(new Request("https://example.com"));
    expect(res.status).toBe(500);
    expect(await body(res)).toEqual({ success: false, error: "boom" });
  });

  it("catches non-Error throws", async () => {
    const handler = withApiHandler(async (_req: Request) => {
      throw "string error";
    });
    const res = await handler(new Request("https://example.com"));
    expect(res.status).toBe(500);
  });
});