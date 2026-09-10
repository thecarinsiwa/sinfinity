import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth/constants";

const PUBLIC_PATHS = [
  "/login",
  "/forbidden",
  "/system/health",
  "/dev/ui",
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function hasSessionCookie(request: NextRequest): boolean {
  return (
    Boolean(request.cookies.get(ACCESS_COOKIE)?.value) ||
    Boolean(request.cookies.get(REFRESH_COOKIE)?.value)
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const authenticated = hasSessionCookie(request);

  if (pathname === "/login" && authenticated) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!isPublicPath(pathname) && !authenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
