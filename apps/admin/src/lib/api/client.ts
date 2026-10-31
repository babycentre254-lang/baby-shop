import type { ApiResponse } from "@baby-shop/shared";

// ═══════════════════════════════════════════════════════════
// Config
// ═══════════════════════════════════════════════════════════

const API_URL = (process.env.API_URL ?? "http://127.0.0.1:4000/api/v1").replace(/[./]+$/, "");

// ═══════════════════════════════════════════════════════════
// Error class
// ═══════════════════════════════════════════════════════════

export class ApiClientError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiClientError";
  }

  /** True if this is a 401 — the caller should redirect to /login */
  get isAuthError(): boolean {
    return this.status === 401;
  }

  /** True if this is a 403 — role issue */
  get isForbidden(): boolean {
    return this.status === 403;
  }

  /** True if this is a 404 — resource not found */
  get isNotFound(): boolean {
    return this.status === 404;
  }
}

// ═══════════════════════════════════════════════════════════
// Internal helpers
// ═══════════════════════════════════════════════════════════

/**
 * Parse a response into our ApiResponse envelope.
 * Handles the case where the server returns HTML (Next.js 404 page),
 * an empty body, or a non-JSON 500 error — all of which would
 * otherwise crash `res.json()` with "Unexpected token '<'".
 */
async function parseResponse<T>(res: Response, path: string): Promise<T> {
  if (res.status === 204 || res.status === 205) return undefined as T;
  const contentType = res.headers.get("content-type") ?? "";

  // ─── Non-JSON response ───
  if (!contentType.includes("application/json")) {
    // Read a snippet so the error message is actionable
    let snippet = "";
    try {
      const text = await res.text();
      snippet = text.slice(0, 200).replace(/\s+/g, " ").trim();
    } catch {
      /* ignore */
    }

    // If the API is down / path doesn't exist, we usually get an HTML 404 page
    throw new ApiClientError(
      res.status === 404 ? "ENDPOINT_NOT_FOUND" : "INVALID_RESPONSE",
      `Server returned ${res.status} ${res.statusText} (not JSON) for "${path}"${
        snippet ? ` — ${snippet}` : ""
      }`,
      res.status
    );
  }

  // ─── JSON but malformed ───
  let json: ApiResponse<T>;
  try {
    json = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new ApiClientError(
      "MALFORMED_JSON",
      `Server returned invalid JSON for "${path}" (status ${res.status})`,
      res.status
    );
  }

  // ─── Application-level error envelope ───
  if (!json.success) {
    throw new ApiClientError(
      json.error.code,
      json.error.message,
      res.status,
      json.error.details
    );
  }

  return json.data;
}

// ═══════════════════════════════════════════════════════════
// Server-side fetch (Server Components, Server Actions)
// ═══════════════════════════════════════════════════════════

export async function apiServer<T>(
  path: string,
  init?: RequestInit & { cookies?: string }
): Promise<T> {
  const url = `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;

  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  if (init?.cookies) headers.set("Cookie", init.cookies);

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers,
      cache: "no-store",
    });
  } catch (err) {
    // Network failure — API not running, DNS fail, timeout
    throw new ApiClientError(
      "NETWORK_ERROR",
      `Could not reach the API at ${API_URL}${
        err instanceof Error ? ` — ${err.message}` : ""
      }`,
      0
    );
  }

  return parseResponse<T>(res, path);
}

// ═══════════════════════════════════════════════════════════
// Client-side fetch (browser via /api/proxy BFF)
// ═══════════════════════════════════════════════════════════

export async function apiClient<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const url = `/api/proxy${path.startsWith("/") ? path : `/${path}`}`;

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      credentials: "include",
    });
  } catch (err) {
    throw new ApiClientError(
      "NETWORK_ERROR",
      `Could not reach the proxy at ${url}${
        err instanceof Error ? ` — ${err.message}` : ""
      }`,
      0
    );
  }

  return parseResponse<T>(res, path);
}

// ═══════════════════════════════════════════════════════════
// Optional: low-level fetch that DOESN'T parse a JSON envelope
// (useful for downloading files, or calling non-enveloped endpoints)
// ═══════════════════════════════════════════════════════════

export async function rawFetch(
  path: string,
  init?: RequestInit
): Promise<Response> {
  const url = `/api/proxy${path.startsWith("/") ? path : `/${path}`}`;

  return fetch(url, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
    },
    credentials: "include",
  });
}
