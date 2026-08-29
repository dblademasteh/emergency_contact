"use client";

/**
 * Lightweight client-side cache for the main page's API data.
 *
 * The home page is a client-rendered SPA that fetches several endpoints on
 * every full page load. For a PWA that "works offline", showing previously
 * loaded data instantly (then refreshing in the background) makes returning
 * visits feel much faster and keeps the app usable when the network is slow
 * or unavailable.
 *
 * Data is kept in memory for the current session and mirrored to localStorage
 * (with a TTL) so it survives reloads. The service worker already caches API
 * responses, but this gives us an instant first paint before the network
 * round-trips complete.
 */

const STORAGE_KEY = "ec-data-cache-v1";
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

type CacheEntry = {
  value: unknown;
  savedAt: number;
};

let memoryCache: Record<string, CacheEntry> | null = null;

function readStorage(): Record<string, CacheEntry> {
  if (memoryCache) return memoryCache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    memoryCache = raw ? (JSON.parse(raw) as Record<string, CacheEntry>) : {};
  } catch {
    memoryCache = {};
  }
  return memoryCache;
}

function writeStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryCache ?? {}));
  } catch {
    // Ignore quota / privacy-mode errors — the in-memory cache still works.
  }
}

/** Store a value under a key with an optional TTL (defaults to 5 minutes). */
export function cacheSet(key: string, value: unknown, ttlMs = DEFAULT_TTL_MS) {
  const cache = readStorage();
  cache[key] = { value, savedAt: Date.now() + ttlMs };
  writeStorage();
}

/** Retrieve a cached value if it exists and hasn't expired. */
export function cacheGet<T>(key: string): T | null {
  const cache = readStorage();
  const entry = cache[key];
  if (!entry) return null;
  if (Date.now() > entry.savedAt) {
    delete cache[key];
    writeStorage();
    return null;
  }
  return entry.value as T;
}

/** Remove a single key (or all keys when no key is given). */
export function cacheClear(key?: string) {
  const cache = readStorage();
  if (key) {
    delete cache[key];
  } else {
    for (const k of Object.keys(cache)) delete cache[k];
  }
  writeStorage();
}
