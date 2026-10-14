import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PREFIXES = ["/account", "/checkout", "/wishlist"];
const AUTH_ROUTES = ["/login", "/register", "/forgot-password"];

function tokenIsExpired(token?: string): boolean {
  if (!token) return true;
  try {
    const payload = token.split(".")[1];
    if (!payload) return true;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(atob(normalized));
    return typeof decoded.exp !== "number" || decoded.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const accessToken = req.cookies.get("access_token")?.value;
  const hasSession = !tokenIsExpired(accessToken);
  const hasRefresh = req.cookies.has("refresh_token");

  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (!hasSession && hasRefresh) {
      const url = req.nextUrl.clone();
      url.pathname = "/api/auth/refresh";
      url.search = "";
      url.searchParams.set("next", pathname + req.nextUrl.search);
      return NextResponse.redirect(url);
    }
    if (!hasSession) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname + req.nextUrl.search);
      return NextResponse.redirect(url);
    }
  }

  if (AUTH_ROUTES.some((p) => pathname === p) && hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/account/orders";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
