"use client";

import { useCallback, useEffect, useState } from "react";

const CSRF_HEADER = "x-csrf-token";
const CSRF_COOKIE = "ec_csrf_token";

let csrfTokenCache: string | null = null;
let csrfTokenPromise: Promise<string | null> | null = null;

/**
 * Retrieves the CSRF token from the cookie.
 * If no cookie exists, requests one from the server.
 */
async function getCsrfToken(): Promise<string | null> {
  // Try to read from cookie first
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === CSRF_COOKIE) {
      return decodeURIComponent(value);
    }
  }

  // If not in cookie, try cache
  if (csrfTokenCache) return csrfTokenCache;

  // If no cache and no cookie, fetch from server
  return ensureCsrfToken();
}

/**
 * Ensures a CSRF token exists, fetching one from the server if needed.
 */
export async function ensureCsrfToken(): Promise<string | null> {
  // Return cached token if we already have one
  if (csrfTokenCache) return csrfTokenCache;
  
  // Return in-flight request if one is happening
  if (csrfTokenPromise) return csrfTokenPromise;

  csrfTokenPromise = (async () => {
    try {
      const res = await fetch("/api/csrf", {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) return null;

      const data = await res.json();
      const token = data.token ?? null;
      
      if (token) {
        csrfTokenCache = token;
      }
      
      return token;
    } catch {
      return null;
    } finally {
      csrfTokenPromise = null;
    }
  })();

  return csrfTokenPromise;
}

/**
 * Custom hook that provides a fetch function with automatic CSRF token handling.
 */
export function useCsrfFetch() {
  const [tokenLoaded, setTokenLoaded] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    ensureCsrfToken().then((t) => {
      setToken(t);
      setTokenLoaded(true);
    });
  }, []);

  const csrfFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const currentToken = token ?? (await ensureCsrfToken());

      const headers = new Headers(options.headers);
      headers.set("Content-Type", "application/json");

      if (currentToken) {
        headers.set(CSRF_HEADER, currentToken);
      }

      return fetch(url, {
        ...options,
        headers,
        credentials: "include",
      });
    },
    [token]
  );

  return { csrfFetch, tokenLoaded: tokenLoaded && token !== null, token };
}

/**
 * Server-side utility to check CSRF token validity.
 */
export function isValidCsrfToken(token: string | undefined): boolean {
  return Boolean(token);
}

/**
 * Server-side middleware helper to protect routes.
 */
export function validateCsrf(request: Request): boolean {
  const headerToken = request.headers.get(CSRF_HEADER);
  const cookieToken = getCookieValue(request, CSRF_COOKIE);

  if (!headerToken || !cookieToken) return false;
  return headerToken === cookieToken;
}

function getCookieValue(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";");
  for (const cookie of cookies) {
    const [cookieName, ...valueParts] = cookie.trim().split("=");
    if (cookieName === name) {
      return decodeURIComponent(valueParts.join("="));
    }
  }
  return null;
}