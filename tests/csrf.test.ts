import { describe, it, expect, beforeAll } from "vitest";
import { createHmac } from "node:crypto";
import { NextRequest } from "next/server";
import { validateCsrfToken, withCsrfProtection } from "@/lib/csrf";

const SECRET = "test-secret-for-vitest";

// Build a token exactly the way generateCsrfToken does.
function makeToken(random = "a".repeat(64)): string {
  const signature = createHmac("sha256", SECRET).update(random).digest("hex");
  return `${random}.${signature}`;
}

function makeRequest(
  method: string,
  cookieToken?: string,
  headerToken?: string
): NextRequest {
  const headers = new Headers();
  if (headerToken) headers.set("x-csrf-token", headerToken);
  const req = new NextRequest(`http://localhost/api/test`, { method, headers });
  // NextRequest built from init headers doesn't parse the cookie header,
  // so set the jar explicitly.
  if (cookieToken) req.cookies.set("ec_csrf_token", cookieToken);
  return req;
}

beforeAll(() => {
  process.env.SESSION_SECRET = SECRET;
});

describe("withCsrfProtection", () => {
  it("allows safe methods without a token", () => {
    for (const method of ["GET", "HEAD", "OPTIONS"]) {
      expect(withCsrfProtection(makeRequest(method))).toBeNull();
    }
  });

  it("blocks POST with no token", () => {
    const res = withCsrfProtection(makeRequest("POST"));
    expect(res).not.toBeNull();
    expect(res?.status).toBe(403);
  });

  it("blocks POST with cookie token but no header token", () => {
    const token = makeToken();
    const res = withCsrfProtection(makeRequest("POST", token));
    expect(res?.status).toBe(403);
  });

  it("blocks POST with header token but no cookie token", () => {
    const token = makeToken();
    const res = withCsrfProtection(makeRequest("POST", undefined, token));
    expect(res?.status).toBe(403);
  });

  it("allows POST with a valid token in both cookie and header", () => {
    const token = makeToken();
    expect(withCsrfProtection(makeRequest("POST", token, token))).toBeNull();
  });

  it("allows PATCH/DELETE with a valid token", () => {
    const token = makeToken();
    expect(withCsrfProtection(makeRequest("PATCH", token, token))).toBeNull();
    expect(withCsrfProtection(makeRequest("DELETE", token, token))).toBeNull();
  });

  it("blocks POST when header and cookie tokens differ", () => {
    expect(
      withCsrfProtection(makeRequest("POST", makeToken(), makeToken("b".repeat(64))))
    ).not.toBeNull();
  });
});

describe("validateCsrfToken", () => {
  it("rejects a token signed with the wrong secret", () => {
    const forged = createHmac("sha256", "wrong-secret")
      .update("a".repeat(64))
      .digest("hex");
    const token = `a${"a".repeat(63)}.${forged}`;
    expect(validateCsrfToken(makeRequest("POST", token, token))).toBe(false);
  });

  it("rejects a token with a tampered payload", () => {
    const token = makeToken();
    // Same valid signature, different random part.
    const tampered = `b${"a".repeat(63)}.${token.split(".")[1]}`;
    expect(validateCsrfToken(makeRequest("POST", tampered, tampered))).toBe(false);
  });

  it("rejects malformed tokens", () => {
    for (const bad of ["", "no-dot", ".nosignature", "random.", "a.b.c"]) {
      expect(validateCsrfToken(makeRequest("POST", bad, bad))).toBe(false);
    }
  });

  it("accepts a correctly signed token", () => {
    const token = makeToken();
    expect(validateCsrfToken(makeRequest("POST", token, token))).toBe(true);
  });
});
