import { NextRequest, NextResponse } from "next/server";

const API_URL = (process.env.API_URL ?? "http://127.0.0.1:4000/api/v1").replace(/[./]+$/, "");

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const target = `${API_URL}/${path.join("/")}${req.nextUrl.search}`;

  // Forward headers, dropping hop-by-hop ones
  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");

  // Read body for non-GET/HEAD
  let body: ArrayBuffer | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await req.arrayBuffer();
  }

let res: Response;
try {
  res = await fetch(target, {
    method: req.method,
    headers,
    body: body && body.byteLength > 0 ? body : undefined,
    redirect: "manual",
  });
} catch (err) {
  const cause = (err as any)?.cause;
  console.error("[BFF proxy] fetch failed:", {
    target,
    method: req.method,
    bodySizeBytes: body?.byteLength ?? 0,
    bodySizeMB: body ? (body.byteLength / 1024 / 1024).toFixed(2) + " MB" : "0",
    errorMessage: err instanceof Error ? err.message : String(err),
    causeCode: cause?.code,
    causeMessage: cause?.message,
  });

  return NextResponse.json(
    {
      success: false,
      error: {
        code: "API_UNREACHABLE",
        message: `Could not reach the API at ${API_URL}: ${
          cause?.code ?? cause?.message ??
          (err instanceof Error ? err.message : "unknown")
        }`,
        details: {
          target,
          method: req.method,
          bodySizeBytes: body?.byteLength ?? 0,
          cause: cause?.code ?? cause?.message,
        },
      },
    },
    { status: 502 }
  );
}

  // Build response headers
  const responseHeaders = new Headers();
  res.headers.forEach((value, key) => {
    if (
      ["transfer-encoding", "connection", "content-encoding"].includes(
        key.toLowerCase()
      )
    ) {
      return;
    }
    responseHeaders.append(key, value);
  });

  // Preserve multiple Set-Cookie headers
  const setCookies = res.headers.getSetCookie?.() ?? [];
  responseHeaders.delete("set-cookie");
  setCookies.forEach((c) => responseHeaders.append("set-cookie", c));

  if (path.join("/") === "auth/refresh" && !res.ok) {
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
    responseHeaders.append(
      "set-cookie",
      `access_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure}`
    );
    responseHeaders.append(
      "set-cookie",
      `refresh_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure}`
    );
    responseHeaders.append(
      "set-cookie",
      `refresh_token=; Path=/api/v1/auth; Max-Age=0; HttpOnly; SameSite=Lax${secure}`
    );
  }

// 204 No Content and 304 Not Modified MUST NOT have a body.
// Passing even an empty ArrayBuffer to NextResponse with these
// statuses throws "Invalid response status code".
const hasBody =
  res.status !== 204 &&
  res.status !== 304 &&
  req.method !== "HEAD";

const responseBody = hasBody ? await res.arrayBuffer() : null;

return new NextResponse(responseBody, {
  status: res.status,
  statusText: res.statusText,
  headers: responseHeaders,
});
};

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
export const HEAD = handler;
