import { describe, it, expect, beforeEach, vi } from "vitest";
import { RateLimiter, getClientIdentifier } from "@/lib/rate-limiter";

describe("RateLimiter", () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    vi.useFakeTimers();
    limiter = new RateLimiter(3, 1000); // 3 requests per second
  });

  it("allows requests up to the max limit", () => {
    expect(limiter.isAllowed("ip-1")).toBe(true);
    expect(limiter.isAllowed("ip-1")).toBe(true);
    expect(limiter.isAllowed("ip-1")).toBe(true);
  });

  it("blocks requests beyond the max limit", () => {
    limiter.isAllowed("ip-2");
    limiter.isAllowed("ip-2");
    limiter.isAllowed("ip-2");
    expect(limiter.isAllowed("ip-2")).toBe(false);
  });

  it("resets after the window expires", () => {
    limiter.isAllowed("ip-3");
    limiter.isAllowed("ip-3");
    limiter.isAllowed("ip-3");
    expect(limiter.isAllowed("ip-3")).toBe(false);

    vi.advanceTimersByTime(1001);

    expect(limiter.isAllowed("ip-3")).toBe(true);
  });

  it("tracks remaining requests correctly", () => {
    expect(limiter.getRemaining("ip-4")).toBe(3);
    limiter.isAllowed("ip-4");
    expect(limiter.getRemaining("ip-4")).toBe(2);
    limiter.isAllowed("ip-4");
    expect(limiter.getRemaining("ip-4")).toBe(1);
    limiter.isAllowed("ip-4");
    expect(limiter.getRemaining("ip-4")).toBe(0);
  });

  it("returns null reset time for unknown identifiers", () => {
    expect(limiter.getResetTime("unknown")).toBeNull();
  });

  it("resets a specific identifier", () => {
    limiter.isAllowed("ip-5");
    limiter.isAllowed("ip-5");
    limiter.isAllowed("ip-5");
    expect(limiter.getRemaining("ip-5")).toBe(0);

    limiter.reset("ip-5");
    expect(limiter.getRemaining("ip-5")).toBe(3);
  });

  it("isolates identifiers from each other", () => {
    limiter.isAllowed("ip-a");
    limiter.isAllowed("ip-a");
    limiter.isAllowed("ip-a");
    expect(limiter.isAllowed("ip-a")).toBe(false);
    expect(limiter.isAllowed("ip-b")).toBe(true);
  });
});

describe("getClientIdentifier", () => {
  it("extracts IP from x-forwarded-for header", () => {
    const request = new Request("https://example.com", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(getClientIdentifier(request)).toBe("1.2.3.4");
  });

  it("extracts IP from x-real-ip header", () => {
    const request = new Request("https://example.com", {
      headers: { "x-real-ip": "9.8.7.6" },
    });
    expect(getClientIdentifier(request)).toBe("9.8.7.6");
  });

  it("falls back to unknown when no IP headers present", () => {
    const request = new Request("https://example.com");
    expect(getClientIdentifier(request)).toBe("unknown");
  });

  it("prefers x-forwarded-for over x-real-ip", () => {
    const request = new Request("https://example.com", {
      headers: {
        "x-forwarded-for": "1.2.3.4",
        "x-real-ip": "9.8.7.6",
      },
    });
    expect(getClientIdentifier(request)).toBe("1.2.3.4");
  });
});