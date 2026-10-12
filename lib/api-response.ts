import { NextResponse } from "next/server";

/**
 * Standardized API response format for consistency across all endpoints.
 * Follows a predictable pattern: { success, data, error, meta }
 */

export type ApiSuccessResponse<T = unknown> = {
  success: true;
  data: T;
  error?: never;
  meta?: Record<string, unknown>;
};

export type ApiErrorResponse = {
  success: false;
  data?: never;
  error: string;
  meta?: Record<string, unknown>;
};

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Creates a successful API response.
 * @param data The data to return
 * @param meta Optional metadata (pagination, counts, etc.)
 */
export function apiOk<T>(data: T, meta?: Record<string, unknown>): NextResponse<ApiResponse<T>> {
  const body: ApiSuccessResponse<T> = { success: true, data, ...(meta ? { meta } : {}) };
  return NextResponse.json(body, { status: 200 });
}

/**
 * Creates a successful API response with a 201 status code.
 */
export function apiCreated<T>(data: T, meta?: Record<string, unknown>): NextResponse<ApiResponse<T>> {
  const body: ApiSuccessResponse<T> = { success: true, data, ...(meta ? { meta } : {}) };
  return NextResponse.json(body, { status: 201 });
}

/**
 * Creates an error response.
 */
export function apiError(
  message: string,
  status: number = 400,
  meta?: Record<string, unknown>
): NextResponse<ApiResponse> {
  const body: ApiErrorResponse = { success: false, error: message, ...(meta ? { meta } : {}) };
  return NextResponse.json(body, { status });
}

/**
 * Creates a 401 Unauthorized response.
 */
export function apiUnauthorized(message = "Authentication required."): NextResponse<ApiResponse> {
  return apiError(message, 401);
}

/**
 * Creates a 403 Forbidden response.
 */
export function apiForbidden(message = "You don't have permission to do that."): NextResponse<ApiResponse> {
  return apiError(message, 403);
}

/**
 * Creates a 404 Not Found response.
 */
export function apiNotFound(message = "Resource not found."): NextResponse<ApiResponse> {
  return apiError(message, 404);
}

/**
 * Creates a 409 Conflict response.
 */
export function apiConflict(message = "Resource already exists."): NextResponse<ApiResponse> {
  return apiError(message, 409);
}

/**
 * Wrapper for API route handlers with built-in error handling.
 * Forwards all arguments (e.g. (request, ctx)) to the wrapped handler.
 */
export function withApiHandler<TArgs extends unknown[]>(
  handler: (...args: TArgs) => Promise<NextResponse> | NextResponse
) {
  return async (...args: TArgs): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("API Error:", error);
      }

      const message = error instanceof Error ? error.message : "An unexpected error occurred.";
      return apiError(message, 500);
    }
  };
}

/**
 * Wrapper for authenticated API route handlers.
 */
export function withAuth(
  handler: (user: { role: "admin" | "user"; id: string; name: string }) => Promise<NextResponse> | NextResponse,
  requiredRole?: "admin" | "user"
) {
  return async (request: Request) => {
    const token = (request.headers.get("cookie")?.match(/ec_admin_session=([^;]+)/) || [])[1];
    // Validate session token
    const { verifySessionToken } = await import("@/lib/auth");
    const session = verifySessionToken(token);
    
    if (!session) {
      return apiUnauthorized();
    }
    
    if (requiredRole && session.role !== requiredRole) {
      return apiForbidden("Admin access required.");
    }
    
    return handler({ role: session.role, id: session.id, name: session.name });
  };
}

/**
 * Standardizes pagination parameters from URL search params.
 */
export function parsePagination(searchParams: URLSearchParams, defaultLimit = 50, maxLimit = 200) {
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(maxLimit, Math.max(1, parseInt(searchParams.get("limit") ?? String(defaultLimit), 10)));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}