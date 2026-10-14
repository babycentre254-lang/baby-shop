import { NextRequest, NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/login", "/forgot-password"];
const STATIC_PREFIXES = ["/_next", "/favicon.ico", "/logo.png", "/api/proxy"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (STATIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const hasSession = req.cookies.has("access_token");
  const isPublic = PUBLIC_ROUTES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  if (!hasSession && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (hasSession && isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
