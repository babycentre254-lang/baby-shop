import type { ApiResponse } from "@baby-shop/shared";

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
}

let refreshInFlight: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = fetch("/api/proxy/auth/refresh", {
      method: "POST",
      credentials: "include",
      cache: "no-store",
    })
      .then((response) => response.ok)
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

/**
 * Client-side fetch: goes through /api/proxy (so cookies work).
 * Use from Client Components with TanStack Query.
 */
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

  const authEndpoint = path.replace(/^\//, "").split("?")[0];
  const canRefresh =
    res.status === 401 &&
    !["auth/login", "auth/register", "auth/refresh", "auth/logout", "auth/forgot-password", "auth/reset-password"].includes(authEndpoint);

  if (canRefresh) {
    if (await refreshSession()) {
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
          `Could not reach the proxy at ${url}${err instanceof Error ? ` — ${err.message}` : ""}`,
          0
        );
      }
    }
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
    throw new ApiClientError(
      res.status === 404 ? "ENDPOINT_NOT_FOUND" : "INVALID_RESPONSE",
      `Server returned ${res.status} ${res.statusText} (not JSON) for "${path}"${
        snippet ? ` — ${snippet}` : ""
      }`,
      res.status
    );
  }

  const json = (await res.json()) as ApiResponse<T>;
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
