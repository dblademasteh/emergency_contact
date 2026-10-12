/**
 * Simple in-memory rate limiter for API endpoints.
 * For production use, consider using Redis or a database-backed store.
 */

type RateLimitEntry = {
  count: number;
  resetTime: number;
};

export class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Checks if a request from the given identifier is allowed.
   * Returns true if allowed, false if rate limited.
   */
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const entry = this.store.get(identifier);

    if (!entry || now > entry.resetTime) {
      // Reset or create new entry
      this.store.set(identifier, { count: 1, resetTime: now + this.windowMs });
      return true;
    }

    if (entry.count >= this.maxRequests) {
      return false;
    }

    entry.count++;
    return true;
  }

  /**
   * Gets the remaining requests for an identifier.
   */
  getRemaining(identifier: string): number {
    const entry = this.store.get(identifier);
    if (!entry || Date.now() > entry.resetTime) return this.maxRequests;
    return Math.max(0, this.maxRequests - entry.count);
  }

  /**
   * Gets the reset time for an identifier (ms timestamp).
   */
  getResetTime(identifier: string): number | null {
    const entry = this.store.get(identifier);
    if (!entry || Date.now() > entry.resetTime) return null;
    return entry.resetTime;
  }

  /**
   * Clears the rate limit for an identifier (useful after successful auth).
   */
  reset(identifier: string): void {
    this.store.delete(identifier);
  }

  /**
   * Cleanup expired entries periodically.
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

// Create instances for different use cases
export const authRateLimiter = new RateLimiter(5, 60000); // 5 attempts per minute for auth
export const apiRateLimiter = new RateLimiter(100, 60000); // 100 requests per minute for general API

// Periodic cleanup (every 5 minutes)
if (typeof globalThis !== "undefined") {
  setInterval(() => {
    authRateLimiter.cleanup();
    apiRateLimiter.cleanup();
  }, 5 * 60 * 1000);
}

/**
 * Extracts the client identifier for rate limiting.
 * Uses IP address, falling back to a default.
 */
export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const xRealIp = request.headers.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  if (xRealIp) {
    return xRealIp.trim();
  }

  return "unknown";
}

/**
 * Middleware helper for rate limiting in API routes.
 */
export function checkRateLimit(
  request: Request,
  limiter: RateLimiter = authRateLimiter
): { allowed: boolean; remaining: number; resetTime: number | null } {
  const identifier = getClientIdentifier(request);
  const allowed = limiter.isAllowed(identifier);
  const remaining = limiter.getRemaining(identifier);
  const resetTime = limiter.getResetTime(identifier);

  return { allowed, remaining, resetTime };
}