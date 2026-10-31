import { NextRequest, NextResponse } from "next/server";

const API_URL = (process.env.API_URL ?? "http://127.0.0.1:4000/api/v1").replace(/[./]+$/, "");

function safeNext(value: string | null): string {
  if (!value?.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/account/orders";
  }
  const parsed = new URL(value, "http://babycentre.local");
  return parsed.origin === "http://babycentre.local"
    ? `${parsed.pathname}${parsed.search}${parsed.hash}`
    : "/account/orders";
}

export async function GET(request: NextRequest) {
  const destination = safeNext(request.nextUrl.searchParams.get("next"));
  const login = new URL("/login", request.url);
  login.searchParams.set("next", destination);

  let apiResponse: Response;
  try {
    apiResponse = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { cookie: request.headers.get("cookie") ?? "" },
      cache: "no-store",
    });
  } catch {
    return NextResponse.redirect(login);
  }

  if (!apiResponse.ok) {
    const response = NextResponse.redirect(login);
    response.cookies.set("access_token", "", { path: "/", maxAge: 0, httpOnly: true, sameSite: "lax" });
    response.cookies.set("refresh_token", "", { path: "/", maxAge: 0, httpOnly: true, sameSite: "lax" });
    response.cookies.set("refresh_token", "", { path: "/api/v1/auth", maxAge: 0, httpOnly: true, sameSite: "lax" });
    return response;
  }

  const response = NextResponse.redirect(new URL(destination, request.url));
  for (const cookie of apiResponse.headers.getSetCookie?.() ?? []) {
    response.headers.append("set-cookie", cookie);
  }
  // Remove the legacy auth-only path cookie used by older deployments.
  response.cookies.set("refresh_token", "", {
    path: "/api/v1/auth",
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
  });
  return response;
}
