import "server-only";

import type { ApiResponse } from "@baby-shop/shared";

const API_URL = process.env.API_URL ?? "http://127.0.0.1:4000/api/v1";

export class ApiServerError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiServerError";
  }
}

/**
 * Server-side fetch: calls NestJS API directly (no proxy overhead).
 * Use from Server Components and Server Actions.
 */
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
    throw new ApiServerError(
      "NETWORK_ERROR",
      `Could not reach the API at ${API_URL}${
        err instanceof Error ? ` — ${err.message}` : ""
      }`,
      0
    );
  }

  if (res.status === 204 || res.status === 205) return undefined as T;
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    let snippet = "";
    try {
      snippet = (await res.text()).slice(0, 200).replace(/\s+/g, " ");
    } catch {
      /* ignore */
    }
    throw new ApiServerError(
      res.status === 404 ? "ENDPOINT_NOT_FOUND" : "INVALID_RESPONSE",
      `Server returned ${res.status} ${res.statusText} (not JSON) for "${path}"${
        snippet ? ` — ${snippet}` : ""
      }`,
      res.status
    );
  }

  const json = (await res.json()) as ApiResponse<T>;
  if (!json.success) {
    throw new ApiServerError(
      json.error.code,
      json.error.message,
      res.status,
      json.error.details
    );
  }

  return json.data;
}
